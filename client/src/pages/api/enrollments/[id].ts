import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  const enrollmentId = parseInt(id as string);

  if (isNaN(enrollmentId)) {
    return res.status(400).json({ message: "Invalid enrollment ID" });
  }

  if (req.method === "GET") {
    try {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          id: enrollmentId,
          OR: [
            { studentId: session.user.id },
            { course: { tutorId: session.user.id } },
          ],
        },
        include: {
          course: {
            include: {
              tutor: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      res.status(200).json(enrollment);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    try {
      const { status } = req.body;

      if (!status || !["active", "rejected", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Verify the enrollment exists and belongs to a course owned by this tutor
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          id: enrollmentId,
          course: {
            tutorId: session.user.id,
          },
        },
      });

      if (!enrollment) {
        return res
          .status(404)
          .json({ message: "Enrollment not found or unauthorized" });
      }

      // Update enrollment status
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
        include: {
          course: {
            include: {
              tutor: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
            },
          },
        },
      });

      res.status(200).json({
        message: "Enrollment updated successfully",
        enrollment: updatedEnrollment,
      });
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "DELETE") {
    try {
      // Verify the enrollment exists and user has permission to delete it
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          id: enrollmentId,
          OR: [
            { studentId: session.user.id }, // Student can withdraw
            { course: { tutorId: session.user.id } }, // Tutor can remove
          ],
        },
      });

      if (!enrollment) {
        return res
          .status(404)
          .json({ message: "Enrollment not found or unauthorized" });
      }

      await prisma.enrollment.delete({
        where: { id: enrollmentId },
      });

      res.status(200).json({ message: "Enrollment deleted successfully" });
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

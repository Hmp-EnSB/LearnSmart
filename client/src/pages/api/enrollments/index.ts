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

  if (req.method === "GET") {
    try {
      const { tutor, courseId, status } = req.query;

      let whereClause: any = {};

      if (tutor === "me") {
        // Get enrollments for courses owned by this tutor
        whereClause.course = {
          tutorId: session.user.id,
        };
      } else {
        // Get enrollments for this student
        whereClause.studentId = session.user.id;
      }

      if (courseId) {
        whereClause.courseId = parseInt(courseId as string);
      }

      if (status) {
        whereClause.status = status;
      }

      const enrollments = await prisma.enrollment.findMany({
        where: whereClause,
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
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          courseId,
          studentId: session.user.id,
        },
      });

      if (existingEnrollment) {
        return res
          .status(400)
          .json({ message: "Already enrolled in this course" });
      }

      // Create new enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          courseId,
          studentId: session.user.id,
          status: "pending",
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

      res.status(201).json({
        message: "Enrollment request submitted successfully",
        enrollment,
      });
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

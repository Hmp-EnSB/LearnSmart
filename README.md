# LearnSmart

A rule-based, offline-first adaptive learning platform that delivers personalized, secure, and transparent online education across disciplines.

## Project Overview

The widespread adoption of online learning platforms has exposed key limitations in traditional e-learning systems, including static content delivery, delayed feedback, and rigid learning progressions. These constraints highlight an urgent need for solutions that can offer personalized learning pathways and timely guidance across all fields of study.

Conventional platforms often struggle to address the diverse and evolving needs of learners in sciences, humanities, arts, and vocational training. They frequently suffer from limited interactivity, lack of immediate feedback, and difficulty sustaining motivation and engagement, which can reduce learning effectiveness and increase dropout rates. This reality underscores the necessity for more adaptive, engaging, and learner-centered educational technologies.

LearnSmart is designed in response to these challenges around four core principles, informed by current educational technology research and applicable across disciplines. The platform dynamically adjusts content difficulty through rule-based analysis of learner interactions, triggering concept reviews or advanced challenges when appropriate. This rule-based adaptation remains transparent and interpretable for educators, supporting fairness, explainability, and trust.

To ensure continuity of learning, LearnSmart employs an offline-first architecture powered by IndexedDB synchronization, allowing uninterrupted access to materials during connectivity interruptions. Robust conflict-resolution mechanisms protect data integrity when the connection is restored, accommodating diverse learner environments and promoting equity of access.

Security is strengthened through time-based one-time password (TOTP) authentication aligned with established cybersecurity standards, protecting user accounts without degrading the user experience. Role-specific dashboards are tailored for students, instructors, and administrators, providing actionable insights aligned with each role's responsibilities and enabling timely, targeted interventions.

This repository documents LearnSmart's design philosophy and implementation. It covers current limitations of e-learning systems, the objectives and principles behind adaptive learning platforms, the technical design (database schemas, frontend architecture, and security protocols), and the integration of offline capabilities and gamified achievement systems. By emphasizing rule-based personalization over opaque machine learning models, LearnSmart proposes a transparent and equitable framework for digital education that aligns with contemporary research on learner-centered analytics, self-regulation, and privacy, positioning it as a responsible and innovative solution for modern online education.

## Key Features

- **Rule-Based Adaptation**: Transparent, interpretable learning path adjustments based on learner interactions
- **Offline-First Architecture**: IndexedDB synchronization for uninterrupted learning access
- **TOTP Security**: Time-based one-time password authentication for account protection
- **Role-Specific Dashboards**: Tailored interfaces for students, instructors, and administrators
- **Cross-Discipline Support**: Applicable across sciences, humanities, arts, and vocational training
- **Data Integrity**: Robust conflict-resolution mechanisms for seamless synchronization

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: JWT, Passport.js, TOTP
- **Build**: Vite, Turbopack
- **UI Components**: Radix UI, Shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL (via Neon)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/LearnSmart.git
cd LearnSmart
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```
DATABASE_URL="postgresql://user:password@host.neon.tech/learnsmart"
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
LearnSmart/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities and helpers
│   └── index.html
├── server/              # Express backend
│   ├── db.ts           # Database connection
│   ├── routes.ts       # API routes
│   └── index.ts        # Entry point
├── shared/             # Shared types and schemas
│   └── schema.ts       # Database schemas
└── package.json
```

## Architecture

### Frontend
- React components with TypeScript for type safety
- Tailwind CSS for styling
- Drizzle ORM on the client for IndexedDB management
- Role-based routing and access control

### Backend
- Express.js REST API
- PostgreSQL for persistent storage
- Drizzle ORM for database management
- JWT authentication with Passport.js

### Database
- PostgreSQL schema with Drizzle migrations
- Tables for users, courses, modules, lessons, and progress tracking

## Learning Path Adaptation

LearnSmart uses rule-based logic to:
1. Monitor learner interactions and performance
2. Evaluate progress against predefined rules
3. Trigger content adjustments (reviews or advanced challenges)
4. Maintain transparent, explainable decisions

## Security

- **Authentication**: JWT tokens with refresh mechanism
- **Two-Factor Auth**: TOTP for enhanced account security
- **Password Security**: Bcrypt hashing
- **Session Management**: Secure session storage with PostgreSQL

## Offline Capabilities

- IndexedDB for local data storage
- Automatic synchronization when connectivity is restored
- Conflict resolution for data consistency
- Full access to materials without internet connection

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please open a GitHub issue or contact the development team.

## Acknowledgments

Research-informed design based on contemporary e-learning best practices and learner-centered analytics principles.

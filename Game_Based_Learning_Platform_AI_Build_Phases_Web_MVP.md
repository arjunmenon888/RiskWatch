# AI Game-Based Learning Platform — Phased Build Plan

## 1. Product Vision

Build a game-based learning platform where creators upload learning material such as **PDF, Word, or PowerPoint files**, select topics from the uploaded content, and use AI to generate playable learning levels **one level at a time**.

The platform should help players learn through this loop:

```text
Read topic explanation
→ Play scenario
→ Answer challenge questions
→ Receive feedback
→ Earn rewards
→ Continue through branching paths
→ Complete game
→ Download certificate as PDF
```

The platform must not behave like a simple quiz generator. It should behave like a **learning game builder** where AI assists the creator while the creator remains in full control.

Short product pitch:

```text
Turn PDFs, Word files, and presentations into interactive learning games — one editable level at a time.
```

---


## 2. Current Development Scope

The current build is for a **web app only**. Do not build iOS, Android, desktop apps, or app-store packaging in the first version.

Current scope:

```text
Web app MVP
Creator web dashboard
Player web gameplay experience
FastAPI backend
PostgreSQL database
PDF/DOCX/PPTX upload and AI processing
Certificate PDF generation
```

Future scope, not part of the current build:

```text
iOS app
Android app
Tablet-optimized native app
Offline mobile gameplay
Push notifications
App Store / Play Store deployment
Native mobile-specific UI patterns
```

Important implementation instruction:

```text
Build all current screens for web-first usage.
The attached Design.png should guide the web dashboard layout.
Mobile/native support should be planned but not implemented in the MVP.
```

---

## 3. Confirmed Technology Stack

Use the following stack for this project:

### Frontend

```text
React Native Web / Expo Web for the current web app MVP
TypeScript
Expo recommended only if using React Native Web
React Navigation or Expo Router for routing
Reusable component-based design system
Web-first responsive dashboard layout
Native iOS and Android builds are future scope only
```

Recommendation:

```text
Because the current product is web-only, build the MVP as a web-first application.
If keeping React Native as the frontend framework, use Expo Web / React Native Web.
Do not spend MVP time on native mobile packaging, device APIs, or app-store deployment.
```

### Backend

```text
FastAPI
Python
Pydantic schemas
SQLAlchemy or SQLModel ORM
Alembic migrations
Background workers for document processing and AI jobs
```

### Database

```text
PostgreSQL
```

### File Storage

```text
Local storage for development
Object storage for production, such as S3-compatible storage
```

### AI Layer

```text
LLM service for topic extraction and level generation
Document parser for PDF, DOCX, and PPTX
Chunking system for source-grounded AI generation
Structured JSON output for generated levels
```

### Certificates

```text
Backend PDF generation from FastAPI
Certificate verification code
Optional QR code for certificate verification
```

### Recommended Project Structure

```text
learnplay/
├── frontend/                     # Web frontend MVP using React Native Web / Expo Web
│   ├── App.tsx
│   ├── src/
│   │   ├── navigation/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   ├── creator/
│   │   │   ├── player/
│   │   │   └── shared/
│   │   ├── components/
│   │   ├── theme/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── utils/
│   └── assets/
│       └── reference/
│           └── Design.png
│
├── backend/                      # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── documents/
│   │   │   ├── certificates/
│   │   │   └── gameplay/
│   │   ├── workers/
│   │   └── db/
│   ├── alembic/
│   └── requirements.txt or pyproject.toml
│
├── docs/
│   ├── reference/
│   │   └── Design.png
│   └── product-plan.md
│
├── docker-compose.yml            # PostgreSQL + backend services for local development
└── README.md
```

---

## 4. Frontend Design Direction

Use the attached image as the visual reference for the app UI.

Place the reference image in the project folder at one of these locations:

```text
frontend/assets/reference/Design.png
```

or:

```text
docs/reference/Design.png
```

Current frontend target:

```text
The attached design represents the web app direction.
Prioritize desktop browser layouts first.
Ensure the layout can shrink gracefully for smaller browser widths.
Do not build native mobile screens in the MVP.
```

The AI coding assistant should use the image as a **design reference**, not as a static background image. The app must be built as a **web-first dashboard** using reusable React Native Web / Expo Web compatible components.

---

## 5. Visual Style Guide

### Overall Style

The design should feel like a modern, premium, game-based learning product.

Use this direction:

```text
Dark futuristic dashboard
Game-like learning interface
Rounded cards
Glassmorphism-style panels
Purple and orange accent colors
XP, badges, streaks, progress bars, and rewards
Large hero sections
Card-based layouts
Clear creator and player modes
```

### Color Tokens

Create a shared theme file:

```text
frontend/src/theme/tokens.ts
```

Recommended design tokens:

```ts
export const colors = {
  background: '#050B18',
  backgroundSoft: '#08111F',
  surface: '#0B1324',
  surfaceElevated: '#111B31',
  card: '#101A2E',
  cardBorder: '#24304A',

  primary: '#7C3AED',
  primaryLight: '#A855F7',
  secondary: '#F97316',
  cyan: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Typography

Use clean, readable typography.

Recommended hierarchy:

```text
Screen title: large, bold
Section heading: medium, bold
Card title: semi-bold
Body text: readable, medium size
Helper text: muted color
XP/reward text: large and bold
```

### UI Components to Build

Create reusable components instead of designing each screen separately.

```text
AppShell
TopBar
SideNav for current web layout
BottomTabs for future mobile layout
DashboardCard
GameCard
CreatorModeCard
PlayerStatsCard
ProgressBar
XPBadge
RewardBadge
UploadCard
Stepper
TopicCard
BlueprintCard
LevelCard
LevelStatusBadge
LevelEditorPanel
ExplanationPanel
ScenarioCard
QuestionCard
AnswerOptionCard
FeedbackBanner
RewardPanel
BranchNode
BranchEditorCanvas
CertificatePreview
PrimaryButton
SecondaryButton
IconButton
EmptyState
LoadingState
ConfirmDeleteModal
```

---

## 6. Web-First Frontend Layout Rules

The reference image is desktop-style and should guide the current web app. Build the MVP for web-first usage while keeping components reusable for future mobile support.

### Future Mobile Layout

Mobile apps are not part of the current MVP. For future mobile screens:

```text
Use bottom tab navigation instead of permanent left sidebar
Stack cards vertically
Use full-width hero cards
Use one primary action per screen
Use collapsible sections for analytics and long forms
Use full-screen gameplay mode
Use step-by-step creator flow screens
```

### Current Web Layout

For the current web app:

```text
Use left sidebar navigation
Use dashboard grid layout
Use right-side panels for stats and recent items
Use larger hero cards
Use split layout for editor screens
Use branch editor canvas with draggable nodes if possible
```

### Navigation Structure

```text
AuthNavigator
├── LoginScreen
├── SignupScreen
└── RoleSelectScreen

CreatorNavigator
├── CreatorDashboardScreen
├── CreatorGamesScreen
├── CreateGameScreen
├── UploadDocumentScreen
├── TopicSelectionScreen
├── BlueprintScreen
├── LevelGenerationScreen
├── LevelEditorScreen
├── BranchEditorScreen
├── GamePreviewScreen
├── PublishGameScreen
└── CreatorAnalyticsScreen

PlayerNavigator
├── PlayerDashboardScreen
├── ExploreGamesScreen
├── GameDetailScreen
├── GameplayScreen
├── RewardsScreen
└── CertificatesScreen
```

---

## 6. Required Frontend Screens

### 6.1 Auth and Role Screens

Build:

```text
Login screen
Signup screen
Role selection screen
Creator / Player mode switch
```

Important rule:

```text
There can be two login experiences visually, but technically use one user account system with roles.
```

---

### 6.2 Player Dashboard

Inspired by the attached design, the player dashboard should include:

```text
Greeting header
Search bar
Hero card: Turn Any Document into an Interactive Learning Game
Trending games
Recommended games
Player level card
XP progress
Streak
Rank
Recent achievements
Certificates shortcut
```

Frontend screen:

```text
frontend/src/screens/player/PlayerDashboardScreen.tsx
```

---

### 6.3 Creator Dashboard

Creator dashboard should include:

```text
Create new game panel
AI Mode card
Manual Mode card
Your creations list
Draft games
Published games
Recent uploads
Creator analytics summary
```

Frontend screen:

```text
frontend/src/screens/creator/CreatorDashboardScreen.tsx
```

---

### 6.4 AI Game Creator Upload Screen

This should match the lower-left part of the reference image.

Include:

```text
Step progress: Upload → Configure → Generate → Review
Upload card
Supported formats: PDF, DOCX, PPTX
Uploaded file preview
Detected topics panel after processing
Next step button
Processing state
Error state
```

Frontend screen:

```text
frontend/src/screens/creator/UploadDocumentScreen.tsx
```

---

### 6.5 Topic Selection Screen

After document processing, show extracted topics.

Include:

```text
Topic title
Topic summary
AI difficulty rating
Source page/slide reference
Select/unselect topic
Edit topic title
Delete topic
Reorder topics
Continue to blueprint
```

---

### 6.6 Blueprint Screen

The blueprint is only a plan. It must not generate the full game.

Include:

```text
Suggested game title
Suggested description
Selected topics
Estimated number of levels
Estimated duration
Reward style
Branching style
Approve blueprint button
Edit blueprint button
```

---

### 6.7 Level Generation Screen

This screen controls level-by-level AI generation.

Include:

```text
Current topic
Generate Level button
Generated level preview
Level status
Approve level button
Edit level button
Regenerate level button
Delete level button
Generate Next Level button disabled until current level is approved
```

Important rule:

```text
AI must generate only one level at a time.
The creator must approve the current level before AI generates the next level.
```

---

### 6.8 Level Editor Screen

This should match the lower-middle part of the reference image but updated to include learning explanation first.

Editor sections:

```text
Level Settings
Topic Explanation
Scenarios
Questions
Answer Options
Correct Answer
Feedback
Rewards
Branching Path
Media
Source References
```

Required editing features:

```text
Edit every field
Autosave or Save button
Preview as player
Approve level
Regenerate selected section using AI
Clone level
Delete level
Lock level from AI changes
```

Frontend screen:

```text
frontend/src/screens/creator/LevelEditorScreen.tsx
```

---

### 6.9 Branching Path Editor

For MVP, start simple.

Show:

```text
Level node
Pass branch
Fail branch
Review/remedial branch
Advanced path if high score
```

Later, support visual node editing.

Frontend implementation recommendation:

```text
Use react-native-svg for branch lines
Use gesture handler only if draggable nodes are needed
For MVP, a structured list editor is acceptable
```

---

### 6.10 Gameplay Screen

This should match the lower-right part of the reference image.

Player flow inside each level:

```text
Level header
Progress bar
XP display
Topic explanation card
Start scenario button
Scenario card
Question card
Answer options
Feedback panel
Reward panel
Next question / next level button
```

Important rule:

```text
Do not show the question first.
Always show the topic explanation before the scenario and challenge.
```

---

### 6.11 Certificate Screen

After completion, show:

```text
Completion celebration
Final score
Total XP
Badges earned
Download certificate PDF button
Certificate ID
Verification QR code optional
```

---

## 7. Core Product Rules and Recommendations

### 7.1 Do Not Generate the Full Game at Once

AI must generate the game level by level.

Correct flow:

```text
Upload document
→ AI extracts topics
→ Creator selects topics
→ AI creates editable blueprint
→ AI generates Level 1
→ Creator reviews and edits Level 1
→ Creator approves Level 1
→ AI generates Level 2
→ Creator reviews and edits Level 2
→ Continue until game is complete
→ Publish game
```

Reason:

```text
Level-by-level generation improves quality, creator trust, and editability.
```

---

### 7.2 The Level Must Teach Before Testing

Each level must start with an explanation of the topic before the player enters the scenario or challenge.

Correct level order:

```text
Level title
→ Learning objective
→ Topic explanation
→ Scenario
→ Challenge / question
→ Answer options
→ Correct answer check
→ Feedback
→ Reward
→ Branching path
```

---

### 7.3 Difficulty Controls the Number of Scenarios and Questions

AI should classify each topic as:

```text
Easy
Medium
Hard
Critical
```

Then AI should generate level content based on difficulty.

| Difficulty | Recommended Explanation Length | Recommended Scenarios | Recommended Questions | Use Case |
|---|---:|---:|---:|---|
| Easy | 75–150 words | 1 | 1 | Basic definitions, simple concepts |
| Medium | 100–250 words | 2 | 2–3 | Decision-making or comparison topics |
| Hard | 150–350 words | 3–5 | 4–7 | Multi-step procedures or complex topics |
| Critical | 200–400 words | 4–6 | 5–8 | Safety, compliance, emergency, medical, legal, or high-risk decisions |

The creator must be able to override:

```text
Difficulty
Scenario count
Question count
Reward
Pass score
Branching rules
```

---

### 7.4 Every AI Output Must Be Editable

The creator must be able to edit:

```text
Game title
Game description
Extracted topics
Learning objectives
Topic explanation
Scenario text
Questions
Answer options
Correct answer
Feedback
Difficulty
Rewards
XP
Badges
Branching paths
Level order
Pass score
Retry rules
Certificate settings
```

The creator must also be able to:

```text
Delete any level they own
Delete any game they own
Clone levels
Regenerate selected fields
Lock approved levels from AI changes
```

---

### 7.5 Draft and Published Versions

A live published game should not break while a creator is editing it.

Use these statuses:

```text
Draft
In Review
Published
Unpublished
Archived
Deleted
```

When a creator edits a published game, create a draft version. The changes should only affect players after the creator republishes the game.

---

## 8. Core User Roles

### 8.1 Creator

A creator can:

```text
Create games
Upload PDF, DOCX, or PPTX files
View AI-extracted topics
Select topics for level generation
Generate one level at a time
Review AI-generated level content
Edit levels at any time
Delete levels
Clone levels
Reorder levels
Edit rewards
Edit branching paths
Preview game as player
Publish game
Unpublish game
Delete own game
Play own game
View player progress and analytics
```

A creator cannot:

```text
Edit another creator's game
Delete another creator's game
Modify another creator's rewards or certificates
```

### 8.2 Player

A player can:

```text
Browse published games
Start a game
Read level explanation
Play level scenarios
Answer questions
Receive feedback
Earn rewards
Follow branching paths
Resume progress
Complete games
Download certificate PDF
View earned certificates and rewards
```

A player cannot:

```text
Edit games
Delete games
Change rewards
Change branching paths
Access creator-only screens
```

### 8.3 Admin

An admin can:

```text
Manage users
Review reported games
Moderate public content
Disable games
View platform analytics
Manage platform settings
```

Admin features can be postponed until after MVP.

---

## 9. PostgreSQL Data Model

Use this as the initial database planning guide.

### 9.1 Users

```text
id UUID primary key
name text
email text unique
password_hash text or auth_provider_id text
role_player boolean default true
role_creator boolean default false
role_admin boolean default false
created_at timestamp
updated_at timestamp
```

### 9.2 Documents

```text
id UUID primary key
creator_id UUID foreign key users.id
file_name text
file_type text
file_url text
processing_status text
extracted_text text optional
created_at timestamp
updated_at timestamp
```

Processing statuses:

```text
uploaded
processing
processed
failed
```

### 9.3 Document Chunks

```text
id UUID primary key
document_id UUID foreign key documents.id
chunk_index integer
content text
page_number integer optional
slide_number integer optional
metadata jsonb
embedding optional
created_at timestamp
```

Use chunks so AI can generate grounded explanations and questions from the uploaded source.

### 9.4 Games

```text
id UUID primary key
creator_id UUID foreign key users.id
document_id UUID foreign key documents.id optional
title text
description text
category text optional
status text
visibility text
version integer
published_version_id UUID optional
created_at timestamp
updated_at timestamp
```

Statuses:

```text
draft
published
unpublished
archived
deleted
```

Visibility:

```text
private
public
organization_only
```

### 9.5 Topics

```text
id UUID primary key
game_id UUID foreign key games.id
document_id UUID foreign key documents.id
title text
summary text
source_chunk_ids UUID[] or jsonb
difficulty_ai text
difficulty_creator_override text optional
selected_for_generation boolean
order_index integer
created_at timestamp
updated_at timestamp
```

### 9.6 Levels

```text
id UUID primary key
game_id UUID foreign key games.id
topic_id UUID foreign key topics.id
level_number integer
title text
learning_objective text
topic_explanation text
difficulty text
status text
scenario_count integer
question_count integer
pass_score numeric
is_locked_from_ai boolean default false
created_at timestamp
updated_at timestamp
```

Level statuses:

```text
not_generated
generated
under_review
approved
published
archived
deleted
```

### 9.7 Scenarios

```text
id UUID primary key
level_id UUID foreign key levels.id
scenario_number integer
title text
scenario_text text
media_url text optional
created_at timestamp
updated_at timestamp
```

### 9.8 Questions

```text
id UUID primary key
level_id UUID foreign key levels.id
scenario_id UUID foreign key scenarios.id
question_number integer
question_text text
question_type text
options_json jsonb
correct_answer_json jsonb
correct_feedback text
incorrect_feedback text
points integer
created_at timestamp
updated_at timestamp
```

Question types:

```text
single_choice
multiple_choice
true_false
sequence_order
matching
short_answer_optional_later
```

For MVP, start with:

```text
single_choice
multiple_choice
true_false
```

### 9.9 Rewards

```text
id UUID primary key
level_id UUID foreign key levels.id
reward_type text
xp integer
badge_name text optional
badge_icon_url text optional
condition_json jsonb
created_at timestamp
updated_at timestamp
```

Reward types:

```text
xp
badge
achievement
bonus
```

### 9.10 Branching Paths

```text
id UUID primary key
game_id UUID foreign key games.id
from_level_id UUID foreign key levels.id
condition_type text
condition_json jsonb
to_level_id UUID foreign key levels.id optional
fallback_level_id UUID foreign key levels.id optional
created_at timestamp
updated_at timestamp
```

Condition examples:

```text
score_greater_than_or_equal
score_less_than
answered_correctly
answered_incorrectly
completed_level
failed_level
```

### 9.11 Player Progress

```text
id UUID primary key
player_id UUID foreign key users.id
game_id UUID foreign key games.id
current_level_id UUID foreign key levels.id optional
status text
total_score numeric
total_xp integer
started_at timestamp
completed_at timestamp optional
updated_at timestamp
```

Progress statuses:

```text
not_started
in_progress
completed
failed
```

### 9.12 Level Attempts

```text
id UUID primary key
player_id UUID foreign key users.id
game_id UUID foreign key games.id
level_id UUID foreign key levels.id
attempt_number integer
score numeric
xp_earned integer
passed boolean
started_at timestamp
completed_at timestamp
```

### 9.13 Answers

```text
id UUID primary key
level_attempt_id UUID foreign key level_attempts.id
question_id UUID foreign key questions.id
selected_answer_json jsonb
is_correct boolean
points_earned integer
created_at timestamp
```

### 9.14 Certificates

```text
id UUID primary key
player_id UUID foreign key users.id
game_id UUID foreign key games.id
certificate_number text unique
certificate_pdf_url text
verification_code text unique
verification_url text
issued_at timestamp
```

---

## 10. FastAPI Backend Route Plan

Use FastAPI routers grouped by feature.

### Auth

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Games

```text
GET    /api/games
POST   /api/games
GET    /api/games/{game_id}
PATCH  /api/games/{game_id}
DELETE /api/games/{game_id}
POST   /api/games/{game_id}/publish
POST   /api/games/{game_id}/unpublish
```

### Documents

```text
POST /api/games/{game_id}/documents/upload
GET  /api/games/{game_id}/documents
GET  /api/documents/{document_id}/status
```

### Topics

```text
POST   /api/games/{game_id}/topics/extract
GET    /api/games/{game_id}/topics
PATCH  /api/topics/{topic_id}
DELETE /api/topics/{topic_id}
```

### AI

```text
POST /api/ai/extract-topics
POST /api/ai/create-blueprint
POST /api/ai/generate-next-level
POST /api/ai/regenerate-level
POST /api/ai/improve-level-field
POST /api/ai/suggest-reward
POST /api/ai/suggest-branch
```

### Levels

```text
GET    /api/games/{game_id}/levels
POST   /api/games/{game_id}/levels
GET    /api/levels/{level_id}
PATCH  /api/levels/{level_id}
DELETE /api/levels/{level_id}
POST   /api/levels/{level_id}/approve
POST   /api/levels/{level_id}/clone
POST   /api/levels/{level_id}/lock
```

### Branching

```text
GET    /api/games/{game_id}/branches
POST   /api/games/{game_id}/branches
PATCH  /api/branches/{branch_id}
DELETE /api/branches/{branch_id}
```

### Player

```text
GET  /api/player/games
POST /api/player/games/{game_id}/start
GET  /api/player/games/{game_id}/progress
POST /api/player/levels/{level_id}/submit-answer
POST /api/player/levels/{level_id}/complete
```

### Certificates

```text
POST /api/player/games/{game_id}/certificate
GET  /api/player/certificates
GET  /api/certificates/{certificate_id}/verify
```

---

## 11. AI Generation Rules

### 11.1 AI Must Generate Source-Grounded Content

AI should only generate content based on the uploaded document.

For every generated level, save:

```text
source_chunk_ids
source page numbers or slide numbers
confidence score
```

This helps the creator verify where the level content came from.

---

### 11.2 AI Should Generate Level by Level

AI generation endpoint should not create all levels in one request.

Correct endpoints:

```text
POST /api/ai/extract-topics
POST /api/ai/create-blueprint
POST /api/ai/generate-next-level
POST /api/ai/regenerate-level
POST /api/ai/suggest-branching-path
POST /api/ai/suggest-rewards
```

---

### 11.3 AI Should Learn From Creator Edits

When generating the next level, AI should consider:

```text
Approved previous levels
Creator edits
Preferred tone
Preferred difficulty
Reward pattern
Branching pattern
Level length
```

Example:

```text
If the creator changes Level 1 from simple quiz style to realistic incident simulation style, AI should use that style for Level 2.
```

---

### 11.4 AI Output Must Be Structured JSON

AI should return structured JSON, not plain text.

Example level JSON:

```json
{
  "title": "Identifying Workplace Hazards",
  "learningObjective": "Learners will identify common workplace hazards and choose safe first actions.",
  "difficulty": "medium",
  "topicExplanation": "Workplace hazards are unsafe conditions that can cause injury...",
  "scenarioCount": 2,
  "questionCount": 3,
  "scenarios": [
    {
      "title": "Wet Floor Near Electrical Panel",
      "scenarioText": "You are walking through a warehouse and notice water near an electrical panel.",
      "questions": [
        {
          "questionType": "single_choice",
          "questionText": "What should you do first?",
          "options": [
            "Ignore it",
            "Warn nearby workers and report it",
            "Touch the panel",
            "Wait for someone else"
          ],
          "correctAnswer": "Warn nearby workers and report it",
          "correctFeedback": "Correct. You protected others and reported the hazard.",
          "incorrectFeedback": "That is not the safest action. Water near electricity can cause serious injury."
        }
      ]
    }
  ],
  "reward": {
    "xp": 100,
    "badgeName": "Hazard Spotter"
  },
  "branching": {
    "pass": "next_level",
    "fail": "review_level"
  },
  "sourceChunkIds": ["chunk_001", "chunk_002"]
}
```

---

## 12. Level Design Specification

Each level must be treated as a mini learning mission.

### 12.1 Level Flow for Player

```text
Open level
→ Read topic explanation
→ Start scenario
→ Answer question or questions
→ See feedback after each question or at end of scenario
→ Receive level result
→ Earn reward if passed
→ Move based on branching path
```

### 12.2 Level Content Fields

Each level should include:

```text
Level title
Learning objective
Topic explanation
Difficulty
Scenario list
Question list
Answer options
Correct answer
Correct feedback
Incorrect feedback
Reward
Branching path
Source references
Creator notes optional
```

### 12.3 Difficulty-Based Level Rules

#### Easy Level

```text
Explanation length: 75–150 words
Scenarios: 1
Questions: 1
Reward: 50 XP
Branching: pass → next level, fail → retry
```

#### Medium Level

```text
Explanation length: 100–250 words
Scenarios: 2
Questions: 2–3
Reward: 100–150 XP
Branching: pass → next level, fail → review level or retry
```

#### Hard Level

```text
Explanation length: 150–350 words
Scenarios: 3–5
Questions: 4–7
Reward: 200–300 XP
Branching: high score → advanced path, low score → remedial path
```

#### Critical Level

```text
Explanation length: 200–400 words
Scenarios: 4–6
Questions: 5–8
Reward: 300–500 XP
Branching: must pass to continue, fail → mandatory review level
```

Critical topics are topics where wrong decisions can create serious risk, such as safety, legal compliance, emergency response, cybersecurity incidents, or medical procedures.

---

## 13. Phased Development Plan

Build one phase at a time. Do not ask the coding AI to build the full product in one prompt.

---

# Phase 0 — Product Setup, Repository, and Design System

## Goal

Set up the web app frontend + FastAPI + PostgreSQL project foundation and UI design system.

## Build

```text
Monorepo folder structure
Web frontend app
FastAPI app
PostgreSQL local development setup
Environment variables
Shared API configuration
Frontend theme tokens
Reusable UI components
Reference image location
README
```

## Frontend Design Tasks

```text
Add Design.png to frontend/assets/reference/Design.png or docs/reference/Design.png
Create theme tokens
Create reusable card, button, badge, progress bar, and layout components
Create web-first layout
Add responsive web layout support for desktop and smaller browser widths
Create placeholder dashboard screens matching the reference image style
```

## AI Coding Prompt

```text
Create a monorepo for a web frontend, FastAPI backend, and PostgreSQL database.

Frontend requirements:
- Use React Native Web / Expo Web with TypeScript for the current web MVP.
- Use Expo Web if choosing React Native Web; otherwise keep the frontend web-first and component-based.
- Create a dark futuristic design system inspired by frontend/assets/reference/Design.png.
- Add theme tokens for colors, spacing, radius, and typography.
- Create reusable components: AppShell, DashboardCard, GameCard, PrimaryButton, SecondaryButton, ProgressBar, XPBadge, RewardBadge, Stepper, UploadCard, and EmptyState.
- Create placeholder screens for Auth, Creator Dashboard, Player Dashboard, Upload Document, Level Editor, Gameplay, and Certificates.

Backend requirements:
- Create a FastAPI app with health check route.
- Add database configuration for PostgreSQL.
- Add initial folder structure for routers, models, schemas, services, and workers.

Do not implement all features yet. The goal is clean structure and visual foundation.
```

## Acceptance Criteria

```text
Web frontend runs locally
FastAPI app runs locally
PostgreSQL can run locally through docker-compose
Frontend has reusable theme tokens
Placeholder screens visually follow the reference image style
README explains setup commands
```

---

# Phase 1 — Authentication and Role-Based Access

## Goal

Allow users to log in as creator or player.

## Build

```text
Signup
Login
Logout
User profile
Role selection
Creator dashboard access
Player dashboard access
Protected routes
JWT or session-based authentication
```

## Recommendation

Use one users table with role flags instead of two separate user systems.

A creator can also act as a player.

## Screens

```text
LoginScreen
SignupScreen
RoleSelectScreen
CreatorDashboardScreen
PlayerDashboardScreen
```

## Permissions

```text
Creator routes require creator role
Player routes require player role
Admin routes require admin role
Creators can only edit their own games
Players can only play published games
```

## AI Coding Prompt

```text
Implement authentication in FastAPI and the web frontend.

Backend:
- Add users table/model.
- Add signup, login, logout or token refresh if needed, and current user endpoints.
- Use secure password hashing.
- Add role flags: role_player, role_creator, role_admin.
- Add dependency guards for creator, player, and admin routes.

Frontend:
- Build LoginScreen, SignupScreen, and RoleSelectScreen.
- Store auth token securely.
- Add navigation guards for creator and player flows.
- A creator should also be able to access player features.
```

## Acceptance Criteria

```text
User can sign up
User can log in
User can choose creator/player role
Creator dashboard is protected
Player dashboard is protected
Creator can access player mode
Unauthorized users are redirected
```

---

# Phase 2 — Creator Game Draft Setup

## Goal

Allow creators to create a game draft before uploading or generating levels.

## Build

```text
Create game form
Game title
Game description
Game category
Game visibility
Game status draft
Creator ownership
Game list in creator dashboard
Delete own game
```

## Screens

```text
CreatorGamesScreen
CreateGameScreen
GameOverviewScreen
```

## AI Coding Prompt

```text
Build creator game management.

Backend:
- Add Game model and migrations.
- Add FastAPI routes to create, list, update, and delete games.
- Enforce ownership checks on every update and delete.

Frontend:
- Create CreatorGamesScreen with cards matching the dark reference design.
- Create CreateGameScreen with AI Mode and Manual Mode cards.
- Add delete confirmation modal.
```

## Acceptance Criteria

```text
Creator can create game draft
Creator can see only own games
Creator can edit own game metadata
Creator can delete own game
Creator cannot access another creator's game
```

---

# Phase 3 — Document Upload and Processing

## Goal

Allow creators to upload PDF, DOCX, and PPTX files.

## Build

```text
File picker UI
File validation
Storage upload
Document database record
Processing status
Text extraction
Chunk creation
Error handling
```

## Supported File Types

```text
PDF
DOCX
PPTX
```

## Processing Flow

```text
Creator uploads file
→ Store original file
→ Extract text
→ Split into chunks
→ Save chunks
→ Mark document as processed
```

## Screen

```text
UploadDocumentScreen
```

## AI Coding Prompt

```text
Implement document upload for PDF, DOCX, and PPTX.

Backend:
- Add Document and DocumentChunk models.
- Add upload endpoint under /api/games/{game_id}/documents/upload.
- Store uploaded files locally for development.
- Extract text from PDF, DOCX, and PPTX.
- Split extracted text into chunks with page or slide metadata where possible.
- Save processing statuses: uploaded, processing, processed, failed.

Frontend:
- Build UploadDocumentScreen with a large upload card inspired by the reference image.
- Show file preview, upload progress, processing status, and detected topics placeholder.
```

## Acceptance Criteria

```text
Creator can upload PDF
Creator can upload DOCX
Creator can upload PPTX
Text is extracted
Chunks are saved
Processing status is visible
Errors are shown clearly
```

---

# Phase 4 — AI Topic Extraction

## Goal

AI extracts learning topics from the uploaded document.

## Build

```text
Extract topics button
AI topic extraction service
Topic list UI
Topic summary
AI difficulty suggestion
Creator can select topics
Creator can edit topic titles
Creator can delete unwanted topics
```

## Topic Output

Each topic should include:

```text
Title
Short summary
Source chunk references
AI difficulty estimate
Recommended level count optional
```

## Screen

```text
TopicSelectionScreen
```

## AI Coding Prompt

```text
Build AI topic extraction from document chunks.

Backend:
- Add Topic model.
- Add /api/ai/extract-topics endpoint.
- AI should identify learning topics from uploaded document chunks.
- Return structured JSON with title, summary, source chunk IDs, and estimated difficulty.
- Save topics to PostgreSQL.

Frontend:
- Build TopicSelectionScreen.
- Creator can review, edit, select, reorder, or delete topics before level generation.
- Show source references and difficulty badges.
```

## Acceptance Criteria

```text
AI extracts topics from uploaded document
Topics are saved
Creator can edit topics
Creator can select topics for game levels
Each topic has source references
Each topic has AI difficulty estimate
```

---

# Phase 5 — Game Blueprint Creation

## Goal

Create a high-level game plan before generating levels.

## Build

```text
Game name suggestion
Game description suggestion
Estimated number of levels
Estimated duration
Selected topic order
Difficulty distribution
Reward style suggestion
Branching style suggestion
```

## Important

The blueprint does not generate all level content. It only creates the plan.

## Blueprint Example

```text
Game Title: Workplace Safety Quest
Total Levels: 6
Estimated Play Time: 20 minutes
Reward Style: XP + badges
Branching Style: pass/fail with review paths
```

## Screen

```text
BlueprintScreen
```

## AI Coding Prompt

```text
Create an AI game blueprint generator.

Backend:
- Add /api/ai/create-blueprint endpoint.
- Use selected topics and document chunks to suggest a game title, description, level order, estimated duration, reward style, and branching style.
- Do not generate full levels.
- Save the blueprint as editable draft data.

Frontend:
- Build BlueprintScreen with editable cards.
- Add Approve Blueprint button.
- Only approved blueprint should enable level generation.
```

## Acceptance Criteria

```text
Creator can generate blueprint
Blueprint is editable
Blueprint does not create all levels
Creator can approve blueprint
Approved blueprint enables level generation
```

---

# Phase 6 — Level-by-Level AI Generation

## Goal

AI generates only one level at a time.

## Build

```text
Generate Level 1 button
Generate Next Level button
Structured level generation
Difficulty-based scenario and question count
Topic explanation first
Scenario and questions second
Rewards and branching suggestions
Source references
```

## Level Generation Rules

AI must generate:

```text
Level title
Learning objective
Topic explanation
Difficulty
Scenarios
Questions
Answer options
Correct answer
Feedback
Reward
Branching suggestion
Source references
```

## AI Context for Next Level

When generating Level 2 or later, include:

```text
Selected topic
Source chunks
Approved previous levels
Creator edits from previous levels
Reward pattern
Branching pattern
Tone/style preference
```

## Screen

```text
LevelGenerationScreen
```

## AI Coding Prompt

```text
Build the generate-next-level AI workflow.

Backend:
- Add /api/ai/generate-next-level endpoint.
- AI must generate only one level at a time from the next selected topic.
- The level must include a topic explanation before scenarios.
- AI must classify difficulty and decide the number of scenarios and questions based on difficulty.
- AI must return structured JSON.
- Save the generated level with status generated or under_review.
- Do not generate future levels until the creator approves the current one.

Frontend:
- Build LevelGenerationScreen.
- Show current topic, generated level summary, status, source references, and actions.
- Disable Generate Next Level until current level is approved.
```

## Acceptance Criteria

```text
AI generates only one level
Level includes explanation before scenario
Difficulty controls scenario/question count
Creator must approve level before next level is generated
Source chunk IDs are saved
AI output is valid structured JSON
```

---

# Phase 7 — Level Review and Editor

## Goal

Allow creators to review and edit every part of a level.

## Build

```text
Level editor screen
Edit title
Edit learning objective
Edit topic explanation
Edit difficulty
Edit scenarios
Edit questions
Edit options
Edit correct answer
Edit feedback
Edit reward
Edit pass score
Approve level
Regenerate level
Delete level
Clone level
Lock level from AI changes
```

## Level Status Flow

```text
not_generated
→ generated
→ under_review
→ approved
→ published
```

## AI Coding Prompt

```text
Build a complete level editor.

Backend:
- Add models/routes for levels, scenarios, questions, rewards, and branching.
- Add update endpoints for every editable field.
- Add approve, clone, delete, and lock actions.
- Validate that each level has explanation, scenario, question, correct answer, feedback, and reward.

Frontend:
- Build LevelEditorScreen inspired by Design.png.
- Include tabs or sections: Settings, Explanation, Scenarios, Questions, Rewards, Branching, Media, Source References.
- Every AI-generated field must be editable.
- Add Preview, Save Level, Approve Level, Regenerate Section, Delete, Clone, and Lock actions.
```

## Acceptance Criteria

```text
Creator can edit all level fields
Creator can approve level
Creator can delete level
Creator can clone level
Creator can lock level
Validation prevents incomplete levels
Only approved current level allows next level generation
```

---

# Phase 8 — Reward System

## Goal

Allow AI to suggest rewards and creators to edit them.

## Build

```text
XP rewards
Badges
Achievements optional
Reward editor
Reward preview
Level completion reward
Game completion reward
```

## AI Reward Rules

```text
Easy: 50 XP
Medium: 100–150 XP
Hard: 200–300 XP
Critical: 300–500 XP
```

Creators can override all rewards.

## AI Coding Prompt

```text
Implement the reward system.

Backend:
- Add Reward model and earned reward tracking.
- AI should suggest XP and optional badge names based on level difficulty.
- Players earn rewards only after completing or passing a level.

Frontend:
- Add RewardPanel and RewardEditor components.
- Creator can edit XP and badge name.
- Player can see earned XP, badges, and total rewards.
```

## Acceptance Criteria

```text
Each level has XP reward
Each level can have badge reward
Creator can edit reward
Player earns reward after passing level
Total XP is tracked
```

---

# Phase 9 — Branching Path Editor

## Goal

Allow AI to suggest branching paths and creators to edit them.

## Build

```text
Visual branching editor or structured branch list
Pass path
Fail path
Score-based path
Review/remedial path
Advanced path
Delete branch
Add branch
Change branch condition
```

## MVP Branching Conditions

Start simple:

```text
Pass level → next level
Fail level → retry same level or review level
High score → advanced path
Low score → review path
```

## Frontend UI Recommendation

For MVP:

```text
Use a structured branch list editor.
```

Later:

```text
Use a node-based editor with react-native-svg and gesture handling.
```

## AI Coding Prompt

```text
Build a branching path system for levels.

Backend:
- Add BranchingPath model and CRUD endpoints.
- Validate that branches point to existing levels in the same game.
- Prevent broken branch loops unless intentionally allowed later.

Frontend:
- Build BranchEditorScreen.
- Start with simple pass/fail branch editing.
- Show each level as a card with pass and fail destinations.
- Add visual branch nodes later.

Gameplay:
- The player gameplay engine must use branch rules to determine the next level.
```

## Acceptance Criteria

```text
Creator can view level flow
Creator can edit pass branch
Creator can edit fail branch
Creator can add review path
Player is routed based on score/pass/fail
Invalid branches are prevented
```

---

# Phase 10 — Player Gameplay Engine

## Goal

Allow players to play published games.

## Build

```text
Browse published games
Start game
Resume game
Read topic explanation
Play scenarios
Answer questions
Get feedback
See score
Earn rewards
Move through branching paths
Complete game
```

## Screens

```text
ExploreGamesScreen
GameDetailScreen
GameplayScreen
RewardsScreen
```

## Player Level Flow

```text
Load current level
Show topic explanation
Show scenario
Show question
Submit answer
Show feedback
Continue to next question
Calculate level score
Award XP and badge
Choose next level using branch rules
Update progress
```

## AI Coding Prompt

```text
Build the player gameplay engine.

Backend:
- Add player progress, level attempts, and answers models.
- Add endpoints to start game, get progress, submit answer, complete level, and determine next level.
- Award XP and badges after passing a level.

Frontend:
- Build GameplayScreen inspired by the reference image.
- Each level starts with the topic explanation, then scenarios and questions.
- After each answer, show feedback.
- At the end of the level, show score, reward, and next action.
- Save progress so the player can resume later.
```

## Acceptance Criteria

```text
Player can start published game
Player can read explanation before questions
Player can answer questions
Player receives feedback
Progress is saved
Rewards are awarded
Branching path determines next level
Player can resume game
```

---

# Phase 11 — Game Publishing and Version Control

## Goal

Allow creators to safely publish games.

## Build

```text
Preview mode
Validation before publish
Publish button
Unpublish button
Published snapshot
Draft editing after publish
Version number
```

## Validation Before Publish

A game can be published only if:

```text
Game has title
Game has description
At least one level exists
All included levels are approved
Each level has explanation
Each level has scenario and question
Each question has correct answer
Rewards are configured
Branching paths are valid
Certificate settings are configured
```

## AI Coding Prompt

```text
Implement game publishing.

Backend:
- Add publish and unpublish endpoints.
- Add validation so incomplete games cannot be published.
- Create a published snapshot or version so future draft edits do not break the live player experience.

Frontend:
- Build GamePreviewScreen and PublishGameScreen.
- Show validation checklist before publishing.
- Players should only see published versions.
```

## Acceptance Criteria

```text
Creator can preview game
Incomplete games cannot be published
Creator can publish valid game
Players see only published games
Creator can edit draft without affecting published version
Creator can unpublish game
```

---

# Phase 12 — Certificate PDF Generation

## Goal

Generate downloadable certificates after game completion.

## Build

```text
Completion detection
Certificate template
PDF generation
Certificate number
Verification code
QR code optional
Download button
Certificate history
```

## Certificate Fields

```text
Player name
Game title
Creator name
Completion date
Score
XP earned
Certificate ID
Verification QR code optional
```

## AI Coding Prompt

```text
Build certificate generation.

Backend:
- When a player completes a game, generate a PDF certificate.
- Include player name, game title, creator name, completion date, score, XP, certificate ID, and verification code.
- Save certificate record and PDF URL.
- Add certificate verification endpoint.

Frontend:
- Add completion celebration screen.
- Add CertificatePreview and download button.
- Add CertificatesScreen for certificate history.
```

## Acceptance Criteria

```text
Certificate is generated after completion
Certificate is downloadable as PDF
Certificate has unique ID
Certificate has verification code or QR
Player can view certificate history
```

---

# Phase 13 — Creator Analytics

## Goal

Allow creators to understand how players perform.

## Build

```text
Game plays count
Completion rate
Average score
Average time optional
Level failure rate
Question wrong answer rate
Certificate count
```

## Useful Analytics

```text
Which level is hardest?
Which question is most often wrong?
How many players completed the game?
How many certificates were issued?
```

## AI Coding Prompt

```text
Build creator analytics for each game.

Backend:
- Add analytics queries for starts, completions, completion rate, average score, level failure rates, most missed questions, total XP awarded, and certificates issued.
- Only the game owner can view analytics.

Frontend:
- Build CreatorAnalyticsScreen with dark dashboard cards matching the reference design.
- Show charts/cards only after enough data exists.
```

## Acceptance Criteria

```text
Creator can view analytics for own game
Analytics show starts and completions
Analytics show difficult levels/questions
Analytics respect ownership permissions
```

---

# Phase 14 — AI Quality Improvements

## Goal

Improve content quality and creator trust.

## Build

```text
Regenerate with instruction
Improve explanation
Make scenario more realistic
Make easier
Make harder
Convert question type
Generate review level
Suggest better feedback
Source citation viewer
```

## AI Editing Actions

For each level, add AI helper buttons:

```text
Improve explanation
Simplify language
Make scenario more game-like
Add another scenario
Reduce number of questions
Make questions harder
Create remedial branch
Suggest better reward
```

## AI Coding Prompt

```text
Add AI editing tools to the level editor.

Backend:
- Add /api/ai/improve-level-field endpoint.
- AI must only update the selected field and must not overwrite the whole level.
- Respect locked fields.
- Keep AI output grounded in source document chunks.

Frontend:
- Add AI action buttons in LevelEditorScreen.
- Show AI suggestion preview before saving.
```

## Acceptance Criteria

```text
Creator can improve one field using AI
AI does not overwrite entire level
Locked levels/fields are protected
AI suggestions are previewed before saving
```

---

# Phase 15 — Marketplace and Public Discovery

## Goal

Allow creators to publish games publicly and players to discover them.

Build later, not MVP.

## Build

```text
Public game listings
Categories
Search
Ratings
Reviews
Creator profile
Featured games
Paid games optional
Revenue share optional
```

## AI Coding Prompt

```text
Build a public discovery marketplace for published games.

Backend:
- Add search/filter endpoints for public games.
- Add ratings and reviews after completion.

Frontend:
- Build ExploreGamesScreen with game cards inspired by Design.png.
- Add search by category, title, creator, difficulty, and estimated duration.
- Add CreatorProfileScreen later.
```

## Acceptance Criteria

```text
Players can discover public games
Players can search games
Players can rate completed games
Creator profile page exists
```

---

# Phase 16 — Enterprise Features

## Goal

Support organizations and teams.

Build later, not MVP.

## Build

```text
Organizations
Team management
Assign games to learners
Due dates
Compliance reports
Bulk certificates
SSO
LMS integration
SCORM/xAPI optional
```

## AI Coding Prompt

```text
Add organization support.

Organizations can invite members, assign games, track completion, and export reports.
Keep this separate from the individual creator/player MVP flow.
```

---

## 14. Build Order Recommendation

Build in this order:

```text
1. Repository, web-first design system, FastAPI setup, PostgreSQL setup
2. Auth and roles
3. Creator game draft
4. Document upload and parsing
5. AI topic extraction
6. Topic selection UI
7. Blueprint generation
8. One-level AI generation
9. Level editor
10. Level approval flow
11. Generate next level after approval
12. Simple rewards
13. Simple branching
14. Player gameplay
15. Progress tracking
16. Certificate PDF
17. Publishing/versioning
18. Analytics
19. Marketplace
20. Enterprise features
```

Do not start with marketplace, multiplayer, or advanced visuals. The core value is the AI-assisted level-by-level learning game creation flow.

---

## 15. MVP Definition

The MVP is complete when:

```text
A creator can upload a document
AI can extract topics
Creator can select a topic
AI can generate one level
Creator can edit the level
Creator can approve the level
AI can generate the next level only after approval
Creator can publish the game
A player can play the game
Player learns from explanation before answering
Player earns rewards
Player progress is saved
Player receives downloadable PDF certificate after completion
```

Do not include these in MVP:

```text
Marketplace
Multiplayer
Team training
Advanced analytics
LMS integration
Complex 3D game engine
Offline mode
Payments
```

---

## 16. Important AI Prompt Templates

### 16.1 Topic Extraction Prompt

```text
You are an instructional design assistant. Analyze the provided document chunks and extract learning topics that can become game levels.

Return JSON only.

Each topic must include:
- title
- short summary
- suggested difficulty: easy, medium, hard, or critical
- reason for difficulty
- source chunk IDs

Do not invent topics that are not supported by the document.
```

### 16.2 Level Generation Prompt

```text
You are generating one learning game level only.

Use only the provided document chunks and approved previous level context.

The level must teach before testing.

Return JSON only with:
- title
- learningObjective
- topicExplanation
- difficulty
- scenarioCount
- questionCount
- scenarios
- questions
- answer options
- correct answer
- correct feedback
- incorrect feedback
- reward suggestion
- branching suggestion
- sourceChunkIds

Rules:
- Do not generate future levels.
- Do not create unsupported facts.
- Explanation must be clear and beginner-friendly.
- Number of scenarios and questions must match difficulty.
- Feedback must help the player learn, not only say correct or wrong.
```

### 16.3 AI Field Improvement Prompt

```text
Improve only the selected field of this level.

Do not rewrite the full level.
Do not modify locked fields.
Keep the content grounded in the source document.
Return only the updated field value and a short reason for the change.
```

### 16.4 Frontend Design Prompt

```text
Use the image at frontend/assets/reference/Design.png as the design reference.

Create a web app screen that matches the same visual direction:
- Dark futuristic background
- Rounded glass-like cards
- Purple and orange accent buttons
- XP, streak, reward, progress, and badge elements
- Card-based dashboard layout
- Web-first responsive structure

Do not use the image as a background. Build the UI with reusable web-compatible components and theme tokens.
```

---

## 17. Key Risks and How to Avoid Them

### Risk 1: The App Becomes a Quiz Generator

Avoid this by requiring:

```text
Topic explanation before challenge
Scenarios instead of direct quiz questions
Feedback that teaches
Rewards and branching paths
```

### Risk 2: AI Hallucination

Avoid this by:

```text
Using document chunks
Saving source references
Showing source references to creators
Forcing structured JSON
Letting creators approve every level
```

### Risk 3: Creator Loses Control

Avoid this by:

```text
Level-by-level generation
Full editability
Approve before next level
Regenerate option
Lock level option
Draft vs published versions
```

### Risk 4: Levels Become Too Long

Avoid this by:

```text
Difficulty-based scenario/question count
Creator override
Estimated play time per level
Clear level validation
```

### Risk 5: Published Games Break During Editing

Avoid this by:

```text
Versioning
Draft edits
Published snapshots
Republish workflow
```

### Risk 6: Web Design Is Overbuilt for Future Mobile Too Early

Avoid this by:

```text
Building web-first screens now and deferring native mobile screens
Using bottom tabs on phones
Using side navigation for the current web app
Stacking dashboard cards vertically on phones
Keeping gameplay full-screen and focused
```

---

## 18. Final Product Positioning

This product should be positioned as:

```text
An AI-assisted game-based learning platform where creators transform documents into editable, level-by-level learning games.
```

The main differentiator is not simply AI generation. The real differentiator is:

```text
Creator-controlled AI generation
Learning-first level structure
Difficulty-based scenarios and questions
Editable rewards and branching paths
Certificate-based completion
Web game-like experience
FastAPI source-grounded AI backend
PostgreSQL structured learning data
```

---

## 19. Development Rule for AI Coding Assistant

When using an AI coding assistant to build this app, give it **one phase at a time**.

Do not ask it to build the full platform in one prompt.

Recommended workflow:

```text
Give Phase 0 prompt
Review generated code
Run frontend locally
Run backend locally
Run database locally
Fix errors
Commit code
Move to Phase 1
```

Each phase should produce working code before moving to the next phase.


---

# Platform Scope Note

For the current implementation, the AI coding assistant must treat this as a **web application project**. The frontend should be implemented as a web-first interface using the selected React Native Web / Expo Web approach, connected to a FastAPI backend and PostgreSQL database.

Do not implement native iOS or Android workflows in the current phases. Keep the code modular so that future mobile apps can reuse business logic, API clients, theme tokens, and selected UI components later.

Future mobile work should be added only after the web app MVP is stable, including creator flow, player gameplay, AI level generation, rewards, branching paths, progress tracking, and certificate PDF generation.

# 🏆 FIFA World Cup 2026™ Predictor

Welcome to the ultimate FIFA World Cup 2026™ Prediction League! This application allows football fans from around the world to compete by predicting the exact scores of every match in the tournament. Rise up the Global Leaderboard or create Private Leagues to compete directly with your friends!

Built with a premium, modern "glassmorphism" UI and powered by a lightning-fast React frontend and a secure Supabase PostgreSQL backend.

---

<img width="1134" height="851" alt="image" src="https://github.com/user-attachments/assets/941a0cd1-03c2-409e-a2f7-de079e9e2f9d" />


## 🌟 Key Features
- **Live Match Dashboard**: View upcoming and completed matches in a beautiful grid layout.
- **Dynamic Point System**: Automated scoring based on exact scorelines, goal differences, and match outcomes.
- **Global Leaderboard**: See where you rank against every player in the world.
- **Private Leagues**: Generate unique 8-character invite codes and host private leaderboards for your friends.
- **User Profiles**: View public profiles of other users, including their favorite teams, favorite players, and prediction history.
- **Profile Customization**: Edit your public bio and private details securely.

---

## 📖 How to Play & Game Rules

### 1. How to Login
The app supports secure, password-less authentication:
- **Email Magic Link**: Enter your email address and click "Send Magic Link". You will receive an email with a secure link that logs you in instantly.
- **Continue with GitHub**: Click the GitHub button to authenticate securely using your existing GitHub account.

### 2. Making Predictions
- Navigate to the **Matches** tab on the dashboard.
- You will see a list of matches. **You can only predict matches that have not yet kicked off!**
- Once a match reaches its kickoff time, it becomes **🔒 Locked** and predictions can no longer be edited.
- Enter your predicted score (e.g., 2 - 1) and click **Save Prediction**.

### 3. Point System (How Scoring Works)
Points are automatically calculated as soon as the real match finishes:
- **Exact Score Match**: 3 Points (e.g., You predicted 2-1, and the match ended 2-1).
- **Correct Goal Difference**: 2 Points (e.g., You predicted 2-0, and the match ended 3-1. You got the +2 difference correct).
- **Correct Outcome (Win/Loss/Draw)**: 1 Point (e.g., You predicted 2-1, but it ended 1-0. You correctly predicted the home team would win).
- **Wrong Prediction**: 0 Points.
- **Knockout Multipliers**: Some late-stage tournament matches have point multipliers (x2, x3) which will automatically multiply your earned points!

### 4. How to Create or Join a Private League
Want to compete directly with your friends?
- Click the **Leagues** button in the top navigation bar.
- **To Create**: Enter a custom name for your league (e.g., "Office Pool 2026") and click Create. You will be given a unique 8-character invite code (e.g., `a1b2c3d4`).
- **To Join**: Ask your friend for their 8-character invite code, paste it into the "Join League" box, and click Join. You will instantly see your ranking compared to the other members!

### 5. Checking the Global Ranking
- Click the **Global** button (Medal icon) in the top navigation bar.
- This displays the global leaderboard. The player with the highest total points ranks #1.
- *Tiebreaker Rule*: If two players have the exact same amount of points, they share the same rank!

### 6. Updating Your Personal Profile
- Click the **Settings** (Gear icon) button in the top navigation bar.
- Here you can update both your Private Information (DOB, Phone, Address) and your Public Bio (First Name, Last Name, Hobbies, Favorite Team, Favorite Player).
- When other users click on your username in the Leaderboard, they will see your Public Bio and your prediction history. Your private information remains hidden.

---

## 🛠️ Tech Stack & Local Development
- **Frontend**: React (Vite), React Router, Lucide Icons.
- **Backend**: Supabase (PostgreSQL, Row Level Security, Auth, Edge Triggers).
- **Hosting**: GitHub Pages (Frontend) & Supabase Cloud (Backend).

### Running Locally
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Ensure you have a `.env` file with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `npm run dev` to start the local Vite server.

<img width="1103" height="843" alt="image" src="https://github.com/user-attachments/assets/7b9d76cb-361c-49cf-ac6f-ec74d925f30d" />






import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { StartRound } from './pages/StartRound';
import { InRound } from './pages/InRound';
import { RoundHistory } from './pages/RoundHistory';
import { RoundSummary } from './pages/RoundSummary';
import { Notifications } from './pages/Notifications';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Friends } from './pages/Friends';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CompetitionList } from './pages/TournamentList';
import { CreateCompetition } from './pages/CreateTournament';
import { CompetitionDetails } from './pages/TournamentDetails';
import { CompetitionLeaderboard } from './pages/TournamentLeaderboard';
import { SelectCompetition } from './pages/SelectCompetition';
import { CreateCourse } from './pages/CreateCourse';


const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Feed />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/friends/:userId" element={<Friends />} />
            <Route path="/competitions" element={<CompetitionList />} />
            <Route path="/competitions/new" element={<CreateCompetition />} />
            <Route path="/courses/new" element={<CreateCourse />} />
            <Route path="/competitions/:competitionId" element={<CompetitionDetails />} />
            <Route path="/competitions/:competitionId/leaderboard" element={<CompetitionLeaderboard />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/history/:userId" element={<RoundHistory />} />
            <Route path="/select-competition" element={<SelectCompetition />} />
            <Route path="/start-round/:competitionId" element={<StartRound />} />
            <Route path="/round/:roundId" element={<InRound />} />
            <Route path="/summary/:roundId"element={<RoundSummary />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
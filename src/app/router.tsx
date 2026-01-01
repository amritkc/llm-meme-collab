import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../Components/Layout/RootLayout";

import Home from "../pages/Home/Home";
import Consent from "../pages/Consent/Consent";
import IntroHuman from "../pages/IntroHuman/IntroHuman";
import IntroAI from "../pages/IntroAI/IntroAI";
import TaskHumanFirst from "../pages/TaskHumanFirst/TaskHumanFirst";
import TaskAIFirst from "../pages/TaskAIFirst/TaskAIFirst";
import Review from "../pages/Review/Review";
import Feedback from "../pages/Feedback/index";
import Done from "../pages/Done/Done";
import NotFound from "../pages/Notfound/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "consent", element: <Consent /> },
      { path: "intro/human", element: <IntroHuman /> },
      { path: "intro/ai", element: <IntroAI /> },
      { path: "task/human-first", element: <TaskHumanFirst /> },
      { path: "task/ai-first", element: <TaskAIFirst /> },
      { path: "review", element: <Review /> },
      { path: "feedback", element: <Feedback /> },
      { path: "done", element: <Done /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

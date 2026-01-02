import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../constants";
import { useUser } from "../UserContext";

const FeedbackForm = () => {
  const navigate = useNavigate();
  const { userId } = useUser();

  const [enjoyment, setEnjoyment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [aiHelpfulness, setAiHelpfulness] = useState("");
  const [openFeedback, setOpenFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!enjoyment || !difficulty || !aiHelpfulness) return;

    try {
      setLoading(true);

      await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: userId,
          enjoyment,
          difficulty,
          aiHelpfulness,
          openFeedback,
        }),
      });

      navigate("/thank-you");
    } catch (err) {
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-form card">
      <h2>Post-Study Feedback</h2>
      <p>Please answer the following questions about your experience. There are no right or wrong answers.</p>

      {/* Enjoyment */}
      <label>
        <strong>1. How enjoyable did you find the task?</strong>
        <select value={enjoyment} onChange={(e) => setEnjoyment(e.target.value)}>
          <option value="">Select</option>
          <option value="1">1 – Not enjoyable at all</option>
          <option value="2">2</option>
          <option value="3">3 – Neutral</option>
          <option value="4">4</option>
          <option value="5">5 – Very enjoyable</option>
        </select>
      </label>

      {/* Difficulty */}
      <label>
        <strong>2. How difficult was the task?</strong>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">Select</option>
          <option value="1">1 – Very easy</option>
          <option value="2">2</option>
          <option value="3">3 – Moderate</option>
          <option value="4">4</option>
          <option value="5">5 – Very difficult</option>
        </select>
      </label>

      {/* AI Helpfulness */}
      <label>
        <strong>3. To what extent did the AI influence or support your decisions?</strong>
        <select value={aiHelpfulness} onChange={(e) => setAiHelpfulness(e.target.value)}>
          <option value="">Select</option>
          <option value="1">1 – Not at all</option>
          <option value="2">2</option>
          <option value="3">3 – Moderately</option>
          <option value="4">4</option>
          <option value="5">5 – Very strongly</option>
        </select>
      </label>

      {/* Open feedback */}
      <label>
        <strong>4. Any additional comments or feedback?</strong>
        <textarea
          rows={4}
          value={openFeedback}
          onChange={(e) => setOpenFeedback(e.target.value)}
          placeholder="Optional"
        />
      </label>

      <button
        className="btn"
        onClick={handleSubmit}
        disabled={loading || !enjoyment || !difficulty || !aiHelpfulness}
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
};

export default FeedbackForm;

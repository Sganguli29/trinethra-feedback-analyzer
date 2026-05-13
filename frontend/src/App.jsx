import { useState } from "react";
import "./App.css";

const sampleTranscripts = {
  karthik: `Karthik? Haan, he is good. Very sincere boy. Comes on time, leaves on time — actually he stays late most days, I don't ask him to. He's always on the floor. He's not one of those people who sits in the office and sends emails. He's hands-on.

What does he do? He helps me with production tracking. Earlier I used to maintain everything in my head — how many pieces came off each machine, what's the rejection rate, what's pending for dispatch. Now Karthik maintains a sheet. Every evening he updates it and sends it to me on WhatsApp. Very useful. I look at it every morning before the shift meeting.

He also handles a lot of the coordination. When we have quality complaints from Tier 1 — they send an email, sometimes call directly — Karthik takes the first call. He notes down the complaint, talks to the QC team, and gives me a summary. Earlier I used to handle all of this myself. Big relief.

The new drum brake line — he's been involved from the beginning. He helped set up the machine layout. He did a study on cycle times and suggested we move the deburring station closer to the CNC machines. Good idea. We did it. Saved maybe 10 minutes per batch in material handling.

One thing — he doesn't really push back. If I tell him to do something, he does it. Even if it's not the best way. I wish he would tell me sometimes, 'Sir, I think we should do it differently.' But maybe he's still new. He'll get there.`,

  meena: `Meena. Look, she is smart. No doubt. She understands things quickly. But I have some concerns.

She spends too much time on her laptop. In a garment factory, the action is on the floor — cutting, stitching, finishing, packing. If you're not on the floor, you're not seeing what's happening. I tell her — go to the floor, talk to the line supervisors, see what's stuck. She goes, but after 30 minutes she's back at her desk typing.

She made some Excel sheets. Fine. One is an order tracker — which order is at which stage, what's the expected completion date. Another one tracks rejection percentages by line. She found that Line 3 has 14% rejection compared to 6% average on the other lines. Nobody had quantified this before.

She also wrote something she calls an 'SOP' for the cutting section. Step-by-step process for how to handle a new order. It's well-written. But nobody uses it.

On the positive side — she did something useful with the dispatch team. She started tracking which orders are at risk of missing the ship date and sending me a daily email by 11 AM. Before this, I would find out about delays at 4 PM when the container was supposed to leave. Two weeks ago we saved a shipment to Decathlon because of this.

My worry is that she's building things in Excel that nobody asked for and nobody uses. I need someone who solves problems on the floor, not someone who makes beautiful sheets in the office.`,

  anil: `Anil is my right hand. I don't know how we managed before him.

Every morning he's in my office at 8:15 with the day's plan. He prioritizes. Before Anil, I used to walk into the factory and get hit with 10 problems at once. Now he filters.

He handles the retailer complaints. If a retailer calls about expired stock or taste issues, Anil takes the call, logs it, coordinates with the production team, and gets back to the retailer within 24 hours. Our complaint closure time has gone from 5 days to under 2 days since he started.

He manages the daily production meeting. I used to run it — 45 minutes, no agenda. Anil took it over, made a structure, now it's 20 minutes.

Three weeks ago, we had a power failure at 2 AM. The cold chain broke. The night supervisor called him. Anil came to the factory at 3 AM, personally checked the temperature logs, identified compromised batches, and held them from dispatch.

He's so helpful. He takes so much off my plate. My production manager Raghav doesn't plan, so Anil has started doing Raghav's planning for him. If I could keep him for 2 years instead of 6 months, I would.`
};

function ReviewButtons() {
  return (
    <div className="review-buttons">
      <button type="button">Accept</button>
      <button type="button">Edit</button>
      <button type="button">Reject</button>
    </div>
  );
}

function App() {
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transcript })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">DeepThought Role Simulation</p>
        <h1>Supervisor Feedback Analyzer</h1>
        <p>
          Trinethra Module — converts supervisor transcripts into reviewable,
          evidence-based Fellow performance analysis.
        </p>
      </header>

      <section className="card">
        <h2>Transcript Input</h2>
        <p>Paste a supervisor transcript or load one of the sample cases.</p>

        <div className="sample-buttons">
          <button type="button" onClick={() => setTranscript(sampleTranscripts.karthik)}>
            Load Karthik
          </button>
          <button type="button" onClick={() => setTranscript(sampleTranscripts.meena)}>
            Load Meena
          </button>
          <button type="button" onClick={() => setTranscript(sampleTranscripts.anil)}>
            Load Anil
          </button>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste supervisor transcript here..."
        />

        <button className="primary-btn" onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing with Ollama..." : "Run Analysis"}
        </button>
      </section>

      {error && <div className="error">{error}</div>}

      {analysis && (
        <main className="results">
          <section className="card score-card">
            <p className="eyebrow">Suggested Score</p>
            <h2>
              {analysis.score?.value}/10 — {analysis.score?.label}
            </h2>
            <div className="meta-row">
              <span>{analysis.score?.band}</span>
              <span>Confidence: {analysis.score?.confidence}</span>
            </div>
            <p>{analysis.score?.justification}</p>
            <ReviewButtons />
          </section>

          {analysis.summary && (
            <section className="card">
              <h2>Executive Summary</h2>
              <p className="big-text">{analysis.summary.oneLine}</p>

              <div className="two-col">
                <div>
                  <h3>Strengths</h3>
                  <ul>
                    {analysis.summary.strengths?.map((s, index) => (
                      <li key={index}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Risks</h3>
                  <ul>
                    {analysis.summary.risks?.map((r, index) => (
                      <li key={index}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p>
                <b>Recommended intern action:</b>{" "}
                {analysis.summary.recommendedInternAction}
              </p>
            </section>
          )}

          <section className="card">
            <h2>Survivability Test</h2>
            <p>
              <b>Result:</b> {analysis.survivabilityTest?.result}
            </p>
            <p>{analysis.survivabilityTest?.reason}</p>
          </section>

          <section className="card">
            <h2>Extracted Evidence</h2>
            {analysis.evidence?.map((item, index) => (
              <div className="item" key={index}>
                <div className="tag-row">
                  <span>{item.signal}</span>
                  <span>{item.dimension}</span>
                </div>
                <p>
                  <b>Quote:</b> “{item.quote}”
                </p>
                <p>{item.interpretation}</p>
                <ReviewButtons />
              </div>
            ))}
          </section>

          <section className="card">
            <h2>KPI Mapping</h2>
            {analysis.kpiMapping?.map((item, index) => (
              <div className="item" key={index}>
                <h3>{item.kpi}</h3>
                <p>
                  <b>Evidence:</b> {item.evidence}
                </p>
                <p>
                  <b>System or personal:</b> {item.systemOrPersonal}
                </p>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Gap Analysis</h2>
            {analysis.gaps?.map((gap, index) => (
              <div className="item" key={index}>
                <h3>{gap.dimension}</h3>
                <p>{gap.detail}</p>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Suggested Follow-up Questions</h2>
            {analysis.followUpQuestions?.map((q, index) => (
              <div className="item" key={index}>
                <h3>
                  {index + 1}. {q.question}
                </h3>
                <p>
                  <b>Target gap:</b> {q.targetGap}
                </p>
                <p>
                  <b>Looking for:</b> {q.lookingFor}
                </p>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>Possible Supervisor Biases</h2>
            {analysis.biases?.map((bias, index) => (
              <div className="item" key={index}>
                <h3>{bias.bias}</h3>
                <p>{bias.reason}</p>
              </div>
            ))}
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
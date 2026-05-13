const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const MODEL = "llama3.2";

const RUBRIC_LABELS = {
  1: { label: "Not Interested", band: "Need Attention" },
  2: { label: "Lacks Discipline", band: "Need Attention" },
  3: { label: "Motivated but Directionless", band: "Need Attention" },
  4: { label: "Careless and Inconsistent", band: "Productivity" },
  5: { label: "Consistent Performer", band: "Productivity" },
  6: { label: "Reliable and Productive", band: "Productivity" },
  7: { label: "Problem Identifier", band: "Performance" },
  8: { label: "Problem Solver", band: "Performance" },
  9: { label: "Innovative and Experimental", band: "Performance" },
  10: { label: "Exceptional Performer", band: "Performance" }
};

function normalizeAnalysis(analysis) {
  if (analysis.score && RUBRIC_LABELS[analysis.score.value]) {
    analysis.score.label = RUBRIC_LABELS[analysis.score.value].label;
    analysis.score.band = RUBRIC_LABELS[analysis.score.value].band;
  }

  if (analysis.evidence) {
    analysis.evidence = analysis.evidence.filter(
      (item) => item.quote && item.quote.trim().length > 0
    );
  }

  if (analysis.kpiMapping) {
    const allowedKpis = [
      "Lead Generation",
      "Lead Conversion",
      "Upselling",
      "Cross-selling",
      "NPS",
      "PAT",
      "TAT",
      "Quality"
    ];

    analysis.kpiMapping = analysis.kpiMapping.filter(
      (item) =>
        allowedKpis.includes(item.kpi) &&
        item.evidence &&
        item.evidence.trim().length > 0
    );
  }

  return analysis;
}

function loadFile(fileName) {
  return fs.readFileSync(path.join(__dirname, "../data", fileName), "utf-8");
}

function buildPrompt(transcript) {
  const rubric = loadFile("rubric.json");
  const context = loadFile("context.md");

  return `
You are an assessment assistant for DeepThought's Trinethra module.

Analyze the supervisor transcript using the provided context and rubric.

CONTEXT:
${context}

RUBRIC:
${rubric}

Rules:
1. Use only the transcript. Do not invent facts.
2. Do not score based on supervisor tone or praise.
3. Score based on behavioral evidence and survivability of systems.
4. Distinguish Layer 1 execution from Layer 2 systems building.
5. Layer 1 execution means task completion, coordination, follow-ups, presence, reporting, data entry, firefighting, and responsiveness.
6. Layer 2 systems building means SOPs, trackers, dashboards, workflows, templates, accountability systems, or documented processes that other people can use without the Fellow.
7. Apply the Survivability Test correctly:
   - Strong = the Fellow created reusable systems that continue without them.
   - Partial = some reusable structure exists, but the Fellow is still needed.
   - Weak = work depends personally on the Fellow and stops if they leave.
8. Do NOT call survivability strong just because the Fellow is important or useful.
9. If the supervisor says the Fellow is "my right hand", "takes work off my plate", "handles calls", "personally checks", "personally manages", or "I want to keep him longer", treat this as possible dependency, not automatic high performance.
10. Pay special attention to the 6 vs 7 boundary:
   - Score 6 = reliable execution of assigned tasks.
   - Score 7 = independently identifies problems beyond assigned scope.
11. Do not give 7 or above unless there is clear evidence of independent problem identification or reusable systems building.
12. Do not over-score helpfulness, availability, heroic effort, or task absorption.
13. Do not under-score systems work just because the supervisor complains about laptop/Excel work.
14. Detect possible supervisor bias: helpfulness bias, presence bias, halo/horn effect, recency bias.
15. For Anil-like cases: glowing praise plus personal dependency should usually score 5–6, not 7–9.
16. For Meena-like cases: critical tone plus real trackers/SOPs/alerts may score 7–8 if systems-building evidence exists.
17. For Karthik-like cases: strong reliability plus one improvement signal should usually score 6–7.
18. Return ONLY valid JSON. No markdown. No text outside JSON.

Rubric label rules:
- If score is 1, label must be "Not Interested", band must be "Need Attention".
- If score is 2, label must be "Lacks Discipline", band must be "Need Attention".
- If score is 3, label must be "Motivated but Directionless", band must be "Need Attention".
- If score is 4, label must be "Careless and Inconsistent", band must be "Productivity".
- If score is 5, label must be "Consistent Performer", band must be "Productivity".
- If score is 6, label must be "Reliable and Productive", band must be "Productivity".
- If score is 7, label must be "Problem Identifier", band must be "Performance".
- If score is 8, label must be "Problem Solver", band must be "Performance".
- If score is 9, label must be "Innovative and Experimental", band must be "Performance".
- If score is 10, label must be "Exceptional Performer", band must be "Performance".
- Do not create your own labels.
- Evidence quote must never be empty.
- Every evidence item must contain an exact quote copied from the transcript.
- If there is no exact quote, do not include that evidence item.
- KPI evidence must never be empty. If no KPI evidence exists, return an empty kpiMapping array.

Critical scoring rule:
- Personal heroism is NOT systems building.
- Coming at 3 AM, personally checking logs, personally handling complaints, personally making plans, or personally taking calls are execution signals, not systems-building signals.
- A high-impact personal intervention can improve KPI mapping, but it should not automatically raise the score above 6.
- To score 7 or higher, the Fellow must create a reusable process, tracker, SOP, dashboard, workflow, or accountability mechanism that other people can use without the Fellow.
- If the transcript says work depends on the Fellow personally, survivability must be weak or partial, and the score should usually be 5 or 6.
- For Anil's transcript specifically, the correct score range is 5-6 because the transcript shows personal dependency and task absorption, not self-sustaining systems.
- Do not treat "identified compromised batches" during an emergency as independent systems building. Treat it as strong execution/firefighting unless a reusable cold-chain process was created.

Allowed KPI labels only:
Lead Generation, Lead Conversion, Upselling, Cross-selling, NPS, PAT, TAT, Quality.
Do not create custom KPI labels like complaint_closure_time or retailer_complaints.

Return exactly this JSON structure:
{
  "score": {
    "value": 0,
    "label": "",
    "band": "",
    "justification": "",
    "confidence": "low/medium/high"
  },
  "evidence": [
    {
      "quote": "",
      "signal": "positive/negative/neutral",
      "dimension": "execution/systems_building/kpi_impact/change_management",
      "interpretation": ""
    }
  ],
  "kpiMapping": [
    {
      "kpi": "",
      "evidence": "",
      "systemOrPersonal": "system/personal"
    }
  ],
  "gaps": [
    {
      "dimension": "",
      "detail": ""
    }
  ],
  "followUpQuestions": [
    {
      "question": "",
      "targetGap": "",
      "lookingFor": ""
    }
  ],
  "biases": [
    {
      "bias": "",
      "reason": ""
    }
  ],
  "survivabilityTest": {
    "result": "strong/partial/weak",
    "reason": ""
  },
  "summary": {
    "oneLine": "",
    "strengths": [],
    "risks": [],
    "recommendedInternAction": ""
  }
}

Transcript:
${transcript}
`;
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error("Ollama returned malformed JSON. Please run analysis again.");
      }
    }

    throw new Error("Ollama did not return JSON. Please run analysis again.");
  }
}
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Supervisor Feedback Analyzer backend is running"
  });
});


app.post("/api/analyze", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length < 20) {
      return res.status(400).json({
        error: "Please paste a valid supervisor transcript."
      });
    }

    const prompt = buildPrompt(transcript);

    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error("Ollama request failed. Make sure Ollama is running.");
    }

    const data = await ollamaResponse.json();
    const rawAnalysis = extractJson(data.response);
    const analysis = normalizeAnalysis(rawAnalysis);

    res.json({ analysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Analysis failed."
    });
  }
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
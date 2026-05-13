# Supervisor Feedback Analyzer — Trinethra Module

## Overview

This is a local web application built for DeepThought's Trinethra module. It analyzes supervisor feedback transcripts for DT Fellows and generates a structured draft assessment for psychology interns.

The tool does not replace the intern's judgment. It produces a reviewable draft that the intern can validate, accept, reject, or edit.

## Original Product Idea

Supervisor feedback calls currently require interns to manually read transcripts, extract evidence, map behavior to the Fellow rubric, identify gaps, and write follow-up questions.

This app reduces that manual effort by converting a transcript into:

- Extracted evidence
- Rubric score
- KPI mapping
- Gap analysis
- Follow-up questions
- Survivability test
- Supervisor bias detection

## Features

- Paste supervisor transcript
- Load sample transcripts
- Analyze with local Ollama model
- Extract quote-based evidence
- Suggest 1-10 Fellow score
- Map work to business KPIs
- Detect gaps across execution, systems building, KPI impact, and change management
- Apply survivability test
- Detect helpfulness bias, presence bias, halo/horn effect, and recency bias
- Review buttons for intern workflow

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- LLM: Ollama with llama3.2
- Database: None

## Setup Instructions

### 1. Install Ollama

Download Ollama and pull the model:

```bash
ollama pull llama3.2
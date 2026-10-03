"""
services/uncertainty.py — Converts model confidence into uncertainty score.

The uncertainty score drives the Smart Review queue — images the model is
LEAST confident about appear first, so radiologists correct the hardest cases.

Agree with Person 3 on exactly what the model returns before Week 5:
  - A single float (overall confidence)?
  - A per-pixel confidence map?
  - Class probability distribution?
This module converts whatever that is into a single sortable score.
"""

def confidence_to_uncertainty(confidence: float) -> float:
    """
    Simplest conversion: uncertainty = 1 - confidence.
    Higher uncertainty → model less sure → should be reviewed first.
    """
    return round(1.0 - confidence, 4)


def uncertainty_from_probability_map(prob_map) -> float:
    """
    TODO Week 5: if Person 3 returns a per-pixel probability map,
    compute e.g. mean entropy across pixels.
    """
    raise NotImplementedError("Coming in Week 5 once Person 3's output format is confirmed")

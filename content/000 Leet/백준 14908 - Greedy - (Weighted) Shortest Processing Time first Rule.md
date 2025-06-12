---
title: Greedy - (Weighted) Shortest Processing Time first Rule
tags: 
categories: 
createdAt: 2025-06-12 16:56
lastmod: 2025-06-12 16:56
lang: ko
pin: true
math: true
mermaid: true
permalink:
---
# Mathematical Proof: Weighted Shortest Processing Time First (WSPT) Rule

## Problem Statement

Given n jobs with processing times $p_i$ and weights $w_i$ (for $i = 1, 2, ..., n$), we want to find a schedule that minimizes the total weighted completion time:

$$\sum_{i=1}^{n} w_i C_i$$

where $C_i$ is the completion time of job $i$.

**Claim**: The WSPT rule (scheduling jobs in non-decreasing order of $\frac{p_i}{w_i}$) is optimal.

## Proof by Exchange Argument

### Setup

Let $\pi$ be any optimal schedule that is **not** in WSPT order. We will show that we can transform $\pi$ into a WSPT schedule with no increase in objective value, contradicting the optimality of $\pi$.

Since $\pi$ is not in WSPT order, there exist two adjacent jobs $i$ and $j$ in $\pi$ such that:

- Job $i$ is scheduled immediately before job $j$
- $\frac{p_i}{w_i} > \frac{p_j}{w_j}$ (violates WSPT order)

### Analysis of Job Swap

Let's analyze what happens when we swap jobs $i$ and $j$.

**Before swap** (schedule $\pi$):

- Job $i$ completes at time $t + p_i$
- Job $j$ completes at time $t + p_i + p_j$
- Contribution to objective: $w_i(t + p_i) + w_j(t + p_i + p_j)$

**After swap** (schedule $\pi'$):

- Job $j$ completes at time $t + p_j$
- Job $i$ completes at time $t + p_j + p_i$
- Contribution to objective: $w_j(t + p_j) + w_i(t + p_j + p_i)$

where $t$ is the time when the first of these two jobs starts.

### Calculating the Change in Objective

The change in objective value when swapping jobs $i$ and $j$ is:

$$\Delta = \text{(After swap)} - \text{(Before swap)}$$

$$\Delta = [w_j(t + p_j) + w_i(t + p_j + p_i)] - [w_i(t + p_i) + w_j(t + p_i + p_j)]$$

Expanding: $$\Delta = w_j t + w_j p_j + w_i t + w_i p_j + w_i p_i - w_i t - w_i p_i - w_j t - w_j p_i - w_j p_j$$

Simplifying: $$\Delta = w_i p_j - w_j p_i$$

### Key Inequality

Since we assumed $\frac{p_i}{w_i} > \frac{p_j}{w_j}$, we have:

$$\frac{p_i}{w_i} > \frac{p_j}{w_j}$$

Cross-multiplying (since $w_i, w_j > 0$): $$p_i w_j > p_j w_i$$

Rearranging: $$w_i p_j - w_j p_i < 0$$

Therefore: $\Delta < 0$

### Conclusion of Exchange Step

Since $\Delta < 0$, swapping jobs $i$ and $j$ **decreases** the objective value. This means schedule $\pi'$ is strictly better than $\pi$, contradicting the assumption that $\pi$ was optimal.

### Completing the Proof

By repeatedly applying this exchange argument to any pair of adjacent jobs that violate the WSPT order, we can transform any schedule into a WSPT schedule without increasing the objective value.

Since we started with an optimal schedule and only made improvements (or no change), the resulting WSPT schedule must also be optimal.

Moreover, since any non-WSPT schedule can be improved, **every optimal schedule must be in WSPT order**.

## Formal Statement of Optimality

**Theorem**: A schedule is optimal for minimizing $\sum_{i=1}^{n} w_i C_i$ if and only if jobs are sequenced in non-decreasing order of $\frac{p_i}{w_i}$.

## Application to the Shoe Repair Problem

In the context of BOJ problem 14908:

- $p_i = T_i$ (processing time for task $i$)
- $w_i = S_i$ (penalty cost per day for task $i$)
- Objective: minimize total compensation = $\sum_{i=1}^{n} S_i \cdot (\text{completion time of task } i)$

Therefore, the optimal strategy is to sort tasks by $\frac{T_i}{S_i}$ in ascending order.

## Complexity

The WSPT algorithm has time complexity $O(n \log n)$ due to the sorting step, where $n$ is the number of jobs.
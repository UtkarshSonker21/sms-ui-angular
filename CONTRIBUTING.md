# Contributing Guide

Welcome to the Scholarship Management System.

This document explains our Git workflow, coding standards, and development process.

---

## Branches

- main
- develop
- feature/*

---

## Never commit directly to

- main
- develop

Always create a feature branch.

---

## Create Feature Branch

```bash
git checkout develop
git pull origin develop

git checkout -b feature/login
```

---

## Commit

```bash
git add .
git commit -m "Added login page"
```

---

## Push

```bash
git push -u origin feature/login
```

---

## Merge Workflow

Before merging:

```bash
git checkout develop
git pull origin develop

git checkout feature/login
git merge develop
```

Resolve conflicts and test.

Then:

```bash
git checkout develop
git merge feature/login
git push origin develop
```
# Review & Approval System - Implementation Summary

## Overview
Implemented a complete review and approval workflow for tasks, allowing reviewers to approve or return completed work.

## New Features

### 1. New Status: "pending_review"
- When employee completes a task, they click "Send for Review"
- Task automatically moves to "pending_review" status
- Notification sent to assigned reviewer

### 2. Reviewer Assignment
- Each task can have an assigned reviewer
- Reviewer can be a manager or another employee
- Set from task details page

### 3. Review Dashboard
- New page: "Review Dashboard" in sidebar
- Shows all tasks assigned to current user as reviewer
- Split into two sections:
  - **Pending Review**: Tasks waiting for review
  - **Approved**: Tasks that have been approved

### 4. Reviewer Actions
Two options for each task:
- **Approve**: Move task to "done" status
- **Return**: Send task back to "in_progress" (employee gets notification)

### 5. Completed Tasks Display
In "My Tasks" page:
- Active tasks shown at top
- Completed tasks shown at bottom in separate section
- Completed tasks have strikethrough line and 60% opacity

### 6. Automatic Notifications
- Task sent for review → Notification to reviewer
- Task returned → Notification to assignee

## Workflow

```
1. Manager creates task, assigns employee + reviewer
   ↓
2. Employee receives task (assigned)
   ↓
3. Employee starts work (in_progress)
   ↓
4. Employee completes and clicks "Send for Review" (pending_review)
   ↓ Notification to reviewer
5. Reviewer opens Review Dashboard
   ↓
6a. Reviewer approves → (done) ✓
   OR
6b. Reviewer returns → (in_progress) ↻ Notification to employee
   ↓
7. Employee reworks and sends for review again
```

## Files Modified

### Database
- `supabase/migrations/20240107_add_review_workflow.sql`
  - Added `reviewer_id` column
  - Added `reviewed_at` column
  - Updated status constraint to include `pending_review`
  - Created triggers for automatic notifications

### Types
- `src/types/database.types.ts`
  - Updated `status` type to include `pending_review`
  - Added `reviewer_id` and `reviewed_at` fields

### Components
- `src/components/ui/Badge.tsx`
  - Added color and label for `pending_review` status
  - Added Arabic labels for all statuses

### Pages
- `src/routes/TasksPage.tsx`
  - Separated active tasks from completed tasks
  - Display completed tasks with strikethrough
  - Added "pending_review" stat card

- `src/routes/ReviewPage.tsx` (NEW)
  - Complete review dashboard
  - Display pending and approved tasks
  - Approve/Return buttons

- `src/routes/TaskDetailsPage.tsx`
  - Added reviewer selection dropdown
  - Updated status dropdown to include pending_review

- `src/features/tasks/TaskCard.tsx`
  - Changed "Complete" button to "Send for Review"

### Routing
- `src/App.tsx`
  - Added `/review` route

- `src/components/Layout.tsx`
  - Added "Review Dashboard" link to sidebar

### Hooks
- `src/features/tasks/useTasks.ts`
  - Updated `updateTaskStatus` to support `pending_review`
  - Set `completed_at` when sending for review
  - Set `reviewed_at` when approving

## Setup Instructions

1. Run migration in Supabase SQL Editor:
   ```sql
   -- Copy content from:
   supabase/migrations/20240107_add_review_workflow.sql
   ```

2. Refresh the application

3. Assign reviewers to tasks from task details page

4. Employees can now send completed tasks for review

5. Reviewers can access Review Dashboard from sidebar

## Statistics

### My Tasks Page (4 cards):
- Assigned
- In Progress
- **Pending Review** (NEW)
- Done

### Review Dashboard (2 cards):
- Pending Review
- Approved

## Notes

- ✅ Backward compatible with existing tasks
- ✅ Reviewer is optional
- ✅ Anyone can be a reviewer (manager or employee)
- ✅ Notifications work automatically via database triggers
- ✅ Real-time updates via Supabase subscriptions

## Future Enhancements (Optional)

- Reviewer comments when returning tasks
- Review history (how many times task was returned)
- Quality rating system
- Review performance reports

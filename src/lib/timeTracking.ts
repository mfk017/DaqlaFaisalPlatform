import { OrderHistory, Order, WorkflowStage } from '@prisma/client';

export interface StageDuration {
  stage_id: string;
  duration_ms: number;
}

export interface TimeTrackingResult {
  total_lead_time_ms: number;
  stage_durations: Record<string, number>; // map of stage_id to total ms
  rework_count: number;
  is_completed: boolean;
}

export function calculateTimeTracking(
  order: Order,
  history: OrderHistory[]
): TimeTrackingResult {
  const sortedHistory = [...history].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  
  let lastTransitionTime: Date | null = null;
  const stage_durations: Record<string, number> = {};
  let rework_count = 0;
  
  let is_completed = order.status === 'completed';

  for (const event of sortedHistory) {
    if (event.action === 'created') {
      lastTransitionTime = event.created_at;
    } else if (event.action === 'handed_off' || event.action === 'returned' || event.action === 'completed') {
      if (lastTransitionTime) {
        const duration = event.created_at.getTime() - lastTransitionTime.getTime();
        stage_durations[event.stage_id] = (stage_durations[event.stage_id] || 0) + duration;
      }
      lastTransitionTime = event.created_at;

      if (event.action === 'returned') {
        rework_count++;
      }
    }
  }

  // If the order is still in progress (not completed/canceled), add the time spent so far in the current stage
  if (order.status === 'in_progress' && lastTransitionTime && order.current_stage_id) {
    const currentDuration = new Date().getTime() - lastTransitionTime.getTime();
    stage_durations[order.current_stage_id] = (stage_durations[order.current_stage_id] || 0) + currentDuration;
  }

  // Lead time is either time from creation to completion, or creation to NOW if still active
  let total_lead_time_ms = 0;
  if (sortedHistory.length > 0) {
    const creationTime = sortedHistory[0].created_at;
    if (is_completed) {
      // Find the completion event
      const completionEvent = sortedHistory.find(e => e.action === 'completed');
      if (completionEvent) {
        total_lead_time_ms = completionEvent.created_at.getTime() - creationTime.getTime();
      }
    } else {
      total_lead_time_ms = new Date().getTime() - creationTime.getTime();
    }
  }

  return {
    total_lead_time_ms,
    stage_durations,
    rework_count,
    is_completed
  };
}

// Helper to format ms to readable string (e.g., "2h 30m" or "4d 2h")
export function formatDuration(ms: number): string {
  if (ms < 0) return '0m';
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} يوم ${hours % 24} س`;
  }
  if (hours > 0) {
    return `${hours} س ${minutes % 60} د`;
  }
  return `${minutes} د`;
}

// Extract the time an employee took to complete their assigned stages
export function calculateEmployeeMetrics(
  employeeId: string, 
  allHistory: OrderHistory[]
) {
  // We need to find pairs of:
  // 1. Event where `assigned_to_id === employeeId` (Starts the clock)
  // 2. The NEXT event where `actor_id === employeeId` AND action is `handed_off` or `completed` or `returned` (Stops the clock)
  
  // To do this reliably, we group history by order_id, sort by time, and measure the gap.
  const historyByOrder: Record<string, OrderHistory[]> = {};
  for (const h of allHistory) {
    if (!historyByOrder[h.order_id]) historyByOrder[h.order_id] = [];
    historyByOrder[h.order_id].push(h);
  }

  let totalDurationMs = 0;
  let completedTasksCount = 0;
  let reworkCount = 0; // times they were returned TO by quality, or times THEY returned it? PRD: "QC pass rate and rework count". Rework count usually means how many times their work was rejected. So times `assigned_to_id === employeeId` AND action === `returned`.

  for (const orderId in historyByOrder) {
    const sorted = historyByOrder[orderId].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    
    let currentStartTime: Date | null = null;
    
    for (let i = 0; i < sorted.length; i++) {
      const event = sorted[i];

      // If assigned to this employee (and not just them adding a note)
      if (event.assigned_to_id === employeeId && (event.action === 'created' || event.action === 'handed_off' || event.action === 'returned')) {
        currentStartTime = event.created_at;
        if (event.action === 'returned') reworkCount++;
      }
      
      // If employee finishes the task
      if (currentStartTime && event.actor_id === employeeId && (event.action === 'handed_off' || event.action === 'completed' || event.action === 'returned')) {
        totalDurationMs += (event.created_at.getTime() - currentStartTime.getTime());
        completedTasksCount++;
        currentStartTime = null; // reset for next time they get assigned to this order
      }
    }
  }

  const avgCompletionTimeMs = completedTasksCount > 0 ? totalDurationMs / completedTasksCount : 0;

  return {
    completedTasksCount,
    avgCompletionTimeMs,
    reworkCount
  };
}

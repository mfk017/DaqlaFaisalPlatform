import { calculateTimeTracking, formatDuration } from './src/lib/timeTracking.ts';

function testTimeTracking() {
  console.log('--- TESTING PASSIVE TIME TRACKING ---');
  
  const order = {
    id: 'order-1',
    status: 'completed',
    current_stage_id: 'stage-3'
  };

  const t0 = new Date('2026-07-31T08:00:00Z'); // Created
  const t1 = new Date('2026-07-31T09:30:00Z'); // Handed off from Stage 1 (1.5 hours)
  const t2 = new Date('2026-07-31T14:30:00Z'); // Handed off from Stage 2 (5 hours)
  const t3 = new Date('2026-07-31T15:00:00Z'); // Returned from Stage 3 back to Stage 2 (0.5 hours)
  const t4 = new Date('2026-07-31T17:00:00Z'); // Handed off from Stage 2 again (2 hours)
  const t5 = new Date('2026-07-31T18:00:00Z'); // Completed at Stage 3 (1 hour)

  const history = [
    { action: 'created', stage_id: 'stage-1', created_at: t0 },
    { action: 'added_note', stage_id: 'stage-1', created_at: new Date('2026-07-31T08:15:00Z') }, // should be ignored
    { action: 'handed_off', stage_id: 'stage-1', created_at: t1 }, // Ends Stage 1
    { action: 'handed_off', stage_id: 'stage-2', created_at: t2 }, // Ends Stage 2
    { action: 'returned', stage_id: 'stage-3', created_at: t3 }, // Ends Stage 3, sends back to Stage 2
    { action: 'handed_off', stage_id: 'stage-2', created_at: t4 }, // Ends Stage 2 again
    { action: 'completed', stage_id: 'stage-3', created_at: t5 }, // Ends Stage 3
  ];

  // @ts-ignore
  const result = calculateTimeTracking(order, history);
  
  console.log('Result:', result);
  
  // Total Lead Time: T5 - T0 = 10 hours = 36,000,000 ms
  const expectedLeadTime = 10 * 60 * 60 * 1000;
  console.log(`Lead Time: ${formatDuration(result.total_lead_time_ms)} (Expected: 10 س 0 د, Success: ${result.total_lead_time_ms === expectedLeadTime})`);
  
  // Stage 1: 1.5 hours
  const expectedStage1 = 1.5 * 60 * 60 * 1000;
  console.log(`Stage 1 Duration: ${formatDuration(result.stage_durations['stage-1'])} (Success: ${result.stage_durations['stage-1'] === expectedStage1})`);
  
  // Stage 2: 5 hours + 2 hours = 7 hours
  const expectedStage2 = 7 * 60 * 60 * 1000;
  console.log(`Stage 2 Duration: ${formatDuration(result.stage_durations['stage-2'])} (Success: ${result.stage_durations['stage-2'] === expectedStage2})`);
  
  // Stage 3: 0.5 hours + 1 hour = 1.5 hours
  const expectedStage3 = 1.5 * 60 * 60 * 1000;
  console.log(`Stage 3 Duration: ${formatDuration(result.stage_durations['stage-3'])} (Success: ${result.stage_durations['stage-3'] === expectedStage3})`);

  // Rework count: 1
  console.log(`Rework Count: ${result.rework_count} (Success: ${result.rework_count === 1})`);
}

testTimeTracking();

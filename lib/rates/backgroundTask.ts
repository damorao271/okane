import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { refreshExchangeRates } from "@/db/queries/currencies";

// Best-effort, not a guarantee: iOS runs this opportunistically (OS-scheduled,
// no fixed interval, skipped entirely if the app was force-quit). Android via
// WorkManager is more reliable but still has a ~15 minute minimum interval.
// The manual refresh button on Home is the reliable path; this is a bonus.
const TASK_NAME = "refresh-exchange-rates";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await refreshExchangeRates();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerRatesBackgroundTask() {
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (alreadyRegistered) return;

  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 60 * 60, // 1 hour — a hint, not a guarantee (see above)
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

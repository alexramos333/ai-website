/**
 * Google Apps Script — AI Blog Article Generator (4-Step Pipeline)
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete all default code and paste this entire file
 * 4. Click the gear icon (Project Settings) in the left sidebar
 * 5. Scroll to "Script Properties" and click "Add script property"
 * 6. Add these properties:
 *    - Property: API_URL        Value: https://yourdomain.com/api/generate-article
 *    - Property: WEBHOOK_SECRET  Value: (your AI_WEBHOOK_SECRET from .env.local)
 *    - Property: AUTHOR_ID       Value: (your Supabase admin user UUID — optional)
 * 7. Click "Save script properties"
 * 8. Click the clock icon (Triggers) in the left sidebar
 * 9. Click "+ Add Trigger" in the bottom-right
 * 10. Configure:
 *     - Function: processNewKeywords
 *     - Event source: Time-driven
 *     - Type: Minutes timer
 *     - Interval: Every 5 minutes
 * 11. Click Save and authorize when prompted
 *
 * SHEET FORMAT (Row 1 headers):
 * A: Keyword | B: Status | C: Article URL | D: Generated At | E: Error
 *
 * HOW IT WORKS:
 * Every 5 minutes the script checks for the FIRST row where column A has a
 * keyword but column B is empty. It processes only ONE keyword per trigger
 * using a 4-step pipeline:
 *   Step 1: POST /research — Claude researches the keyword (~15-30s)
 *   Step 2: POST /plan    — Claude creates an article plan with metadata (~30-60s)
 *   Step 3: POST /write   — Claude writes the article in Markdown, saved as HTML (~90-180s)
 *   Step 4: POST /image   — Generates a hero image via AI (~20-40s)
 * Each step is a separate API call with its own timeout budget.
 */

/**
 * Main function — called by the time-driven trigger.
 * Finds the FIRST unprocessed keyword and generates an article for it.
 */
function processNewKeywords() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  // Find the first unprocessed keyword (skip header row)
  for (var i = 1; i < data.length; i++) {
    var keyword = data[i][0]; // Column A: Keyword
    var status = data[i][1];  // Column B: Status

    if (keyword && !status) {
      var rowNumber = i + 1; // Sheets are 1-indexed
      generateArticle(sheet, rowNumber, keyword.toString().trim());
      return; // Stop after processing ONE keyword
    }
  }
}

/**
 * Generate a single article using the 4-step pipeline.
 */
function generateArticle(sheet, rowNumber, keyword) {
  var props = PropertiesService.getScriptProperties();
  var baseUrl = (props.getProperty("API_URL") || "").replace(/\/+$/, "");
  var secret = props.getProperty("WEBHOOK_SECRET");
  var authorId = props.getProperty("AUTHOR_ID");

  if (!baseUrl || !secret) {
    sheet.getRange(rowNumber, 2).setValue("ERROR: Missing script properties");
    sheet.getRange(rowNumber, 5).setValue("Set API_URL and WEBHOOK_SECRET in Script Properties");
    return;
  }

  // ── Step 1: Research ──
  sheet.getRange(rowNumber, 2).setValue("Researching...");
  sheet.getRange(rowNumber, 5).setValue("");
  SpreadsheetApp.flush();

  var researchPayload = { keyword: keyword };
  if (authorId) researchPayload.author_id = authorId;

  var researchResult = callApi(baseUrl + "/research", researchPayload, secret);

  if (!researchResult.success) {
    handleStepError(sheet, rowNumber, "Research", researchResult);
    return;
  }

  var jobId = researchResult.data.job_id;
  var researchData = researchResult.data.research_data;

  // ── Step 2: Plan ──
  sheet.getRange(rowNumber, 2).setValue("Planning...");
  SpreadsheetApp.flush();

  var planPayload = {
    job_id: jobId,
    research_data: researchData,
  };

  var planResult = callApi(baseUrl + "/plan", planPayload, secret);

  if (!planResult.success) {
    handleStepError(sheet, rowNumber, "Plan", planResult);
    return;
  }

  var articlePlan = planResult.data.article_plan;
  var imagePrompt = planResult.data.image_prompt || "";

  // ── Step 3: Write ──
  sheet.getRange(rowNumber, 2).setValue("Writing...");
  SpreadsheetApp.flush();

  var writePayload = {
    job_id: jobId,
    article_plan: articlePlan,
  };
  if (authorId) writePayload.author_id = authorId;

  var writeResult = callApi(baseUrl + "/write", writePayload, secret);

  if (!writeResult.success) {
    handleStepError(sheet, rowNumber, "Write", writeResult);
    return;
  }

  var articleUrl = writeResult.data.article ? writeResult.data.article.url : "";
  // Use image_prompt from plan step (already captured above)
  // Write step also returns it, but plan is the authoritative source

  // ── Step 4: Image ──
  sheet.getRange(rowNumber, 2).setValue("Generating image...");
  SpreadsheetApp.flush();

  var imagePayload = { job_id: jobId };
  if (imagePrompt) imagePayload.image_prompt = imagePrompt;

  var imageResult = callApi(baseUrl + "/image", imagePayload, secret);

  // Image failure is non-fatal — article is already published
  var imageNote = "";
  if (!imageResult.success || !imageResult.data || !imageResult.data.image_url) {
    imageNote = "Published without image";
  }

  // ── Done ──
  sheet.getRange(rowNumber, 2).setValue("Published");
  sheet.getRange(rowNumber, 3).setValue(articleUrl);
  sheet.getRange(rowNumber, 4).setValue(new Date().toLocaleString());
  sheet.getRange(rowNumber, 5).setValue(imageNote);
}

/**
 * Make a POST request to an API endpoint.
 * Returns { success: boolean, data?: object, httpCode?: number, error?: string, isDuplicate?: boolean }
 */
function callApi(url, payload, secret) {
  try {
    var options = {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + secret },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    // Parse JSON safely — Vercel may return non-JSON error pages
    var responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch (parseErr) {
      return {
        success: false,
        httpCode: responseCode,
        error: "HTTP " + responseCode + ": " + responseText.substring(0, 300),
      };
    }

    if (responseCode >= 200 && responseCode < 300 && responseBody.success !== false) {
      return { success: true, data: responseBody };
    } else {
      return {
        success: false,
        httpCode: responseCode,
        error: responseBody.error || "HTTP " + responseCode,
        isDuplicate: responseCode === 409,
      };
    }
  } catch (error) {
    return {
      success: false,
      httpCode: 0,
      error: error.toString().substring(0, 400),
    };
  }
}

/**
 * Handle a step failure — mark as Duplicate or clear status for retry.
 */
function handleStepError(sheet, rowNumber, stepName, result) {
  if (result.isDuplicate) {
    sheet.getRange(rowNumber, 2).setValue("Duplicate");
    sheet.getRange(rowNumber, 5).setValue(result.error || "Article already exists");
  } else {
    // Clear status so next trigger retries from Step 1
    sheet.getRange(rowNumber, 2).setValue("");
    sheet.getRange(rowNumber, 5).setValue(
      stepName + " failed: " + (result.error || "Unknown error") + " — will retry"
    );
  }
}

/**
 * Optional: Add a custom menu to manually trigger generation.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Blog Generator")
    .addItem("Generate Next Article", "processNewKeywords")
    .addToUi();
}

/**
 * Optional: Test function — verify the setup works.
 */
function testConnection() {
  var props = PropertiesService.getScriptProperties();
  var baseUrl = props.getProperty("API_URL");
  var secret = props.getProperty("WEBHOOK_SECRET");

  if (!baseUrl) {
    Logger.log("ERROR: API_URL not set in Script Properties");
    return;
  }
  if (!secret) {
    Logger.log("ERROR: WEBHOOK_SECRET not set in Script Properties");
    return;
  }

  Logger.log("API_URL: " + baseUrl);
  Logger.log("WEBHOOK_SECRET: " + (secret ? "Set (" + secret.length + " chars)" : "NOT SET"));
  Logger.log("Setup looks good! The script calls 4 endpoints:");
  Logger.log("  " + baseUrl + "/research");
  Logger.log("  " + baseUrl + "/plan");
  Logger.log("  " + baseUrl + "/write");
  Logger.log("  " + baseUrl + "/image");
}

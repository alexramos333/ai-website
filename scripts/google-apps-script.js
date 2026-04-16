/**
 * Google Apps Script — AI Blog Article Generator Trigger
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete all default code and paste this entire file
 * 4. Click the gear icon (Project Settings) in the left sidebar
 * 5. Scroll to "Script Properties" and click "Add script property"
 * 6. Add these two properties:
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
 * Every 5 minutes the script checks for rows where column A has a keyword
 * but column B is empty. For each one, it calls your API to generate and
 * publish the article, then fills in columns B-E with the result.
 */

/**
 * Main function — called by the time-driven trigger.
 * Scans for unprocessed keywords and generates articles for each.
 */
function processNewKeywords() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  // Skip header row (row 1)
  for (var i = 1; i < data.length; i++) {
    var keyword = data[i][0]; // Column A: Keyword
    var status = data[i][1];  // Column B: Status

    // Only process rows that have a keyword but no status
    if (keyword && !status) {
      var rowNumber = i + 1; // Sheets are 1-indexed
      generateArticle(sheet, rowNumber, keyword.toString().trim());
    }
  }
}

/**
 * Generate a single article for a keyword and update the sheet row.
 */
function generateArticle(sheet, rowNumber, keyword) {
  var props = PropertiesService.getScriptProperties();
  var apiUrl = props.getProperty("API_URL");
  var secret = props.getProperty("WEBHOOK_SECRET");
  var authorId = props.getProperty("AUTHOR_ID");

  if (!apiUrl || !secret) {
    sheet.getRange(rowNumber, 2).setValue("ERROR: Missing script properties");
    sheet.getRange(rowNumber, 5).setValue("Set API_URL and WEBHOOK_SECRET in Script Properties");
    return;
  }

  // Mark as generating
  sheet.getRange(rowNumber, 2).setValue("Generating...");
  SpreadsheetApp.flush(); // Force UI update

  try {
    var payload = { keyword: keyword };
    if (authorId) {
      payload.author_id = authorId;
    }

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + secret,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      // 2-minute timeout (Google Apps Script max is 6 minutes)
      timeout: 120,
    };

    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseCode = response.getResponseCode();
    var responseBody = JSON.parse(response.getContentText());

    if (responseCode === 201 && responseBody.success) {
      // Success
      sheet.getRange(rowNumber, 2).setValue("Published");
      sheet.getRange(rowNumber, 3).setValue(responseBody.article.url);
      sheet.getRange(rowNumber, 4).setValue(new Date().toLocaleString());
      sheet.getRange(rowNumber, 5).setValue(""); // Clear any previous error
    } else if (responseCode === 409) {
      // Duplicate keyword
      sheet.getRange(rowNumber, 2).setValue("Duplicate");
      sheet.getRange(rowNumber, 5).setValue(responseBody.error || "Article already exists");
    } else {
      // Other error
      sheet.getRange(rowNumber, 2).setValue("Failed");
      sheet.getRange(rowNumber, 5).setValue(
        responseBody.error || "HTTP " + responseCode
      );
    }
  } catch (error) {
    sheet.getRange(rowNumber, 2).setValue("Failed");
    sheet.getRange(rowNumber, 5).setValue(error.toString().substring(0, 500));
  }
}

/**
 * Optional: Add a custom menu to manually trigger generation.
 * This adds a "Blog Generator" menu item to your Google Sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Blog Generator")
    .addItem("Process New Keywords", "processNewKeywords")
    .addToUi();
}

/**
 * Optional: Test function — run this manually to verify the setup works.
 * Go to Apps Script editor, select "testConnection" from the dropdown, click Run.
 */
function testConnection() {
  var props = PropertiesService.getScriptProperties();
  var apiUrl = props.getProperty("API_URL");
  var secret = props.getProperty("WEBHOOK_SECRET");

  if (!apiUrl) {
    Logger.log("ERROR: API_URL not set in Script Properties");
    return;
  }
  if (!secret) {
    Logger.log("ERROR: WEBHOOK_SECRET not set in Script Properties");
    return;
  }

  Logger.log("API_URL: " + apiUrl);
  Logger.log("WEBHOOK_SECRET: " + (secret ? "Set (" + secret.length + " chars)" : "NOT SET"));
  Logger.log("Setup looks good! Try adding a keyword to your sheet.");
}

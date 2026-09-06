#include "totp_commands.h"
#include "modules/totp/totp_app.h"
#include "core/serialcmds.h"
#include <ArduinoJson.h>
#include <globals.h>

static uint32_t totpListCallback(cmd *c) {
    JsonDocument doc;
    JsonArray arr = doc.to<JsonArray>();
    const auto &entries = TotpApp::getInstance().getEntries();
    
    time_t nowSec = time(nullptr);
    if (nowSec < 100000) nowSec = 1700000000 + (millis() / 1000);

    for (size_t i = 0; i < entries.size(); i++) {
        JsonObject obj = arr.add<JsonObject>();
        obj["index"] = i;
        obj["name"] = entries[i].name;
        obj["period"] = entries[i].period;
        obj["digits"] = entries[i].digits;
        obj["code"] = TotpApp::generateCode(entries[i].secret, nowSec, entries[i].period, entries[i].digits);
        obj["seconds_left"] = entries[i].period - (nowSec % entries[i].period);
    }
    
    String out;
    serializeJson(doc, out);
    // Prefix with TOTP_JSON: so the frontend can easily identify and parse it.
    serialDevice->println("TOTP_JSON:" + out);
    return true;
}

static uint32_t totpAddCallback(cmd *c) {
    Command cmd(c);
    String name = cmd.getArgument("name").getValue();
    String secret = cmd.getArgument("secret").getValue();
    if (TotpApp::getInstance().addEntry(name, secret)) {
        serialDevice->println("[OK] TOTP added");
        return true;
    }
    serialDevice->println("[ERR] Failed to add TOTP");
    return false;
}

static uint32_t totpAddUriCallback(cmd *c) {
    Command cmd(c);
    String uri = cmd.getArgument("uri").getValue();
    if (TotpApp::getInstance().addFromUri(uri)) {
        serialDevice->println("[OK] TOTP added from URI");
        return true;
    }
    serialDevice->println("[ERR] Failed to add TOTP from URI");
    return false;
}

static uint32_t totpDeleteCallback(cmd *c) {
    Command cmd(c);
    int index = cmd.getArgument("index").getValue().toInt();
    if (TotpApp::getInstance().deleteEntry(index)) {
        serialDevice->println("[OK] TOTP deleted");
        return true;
    }
    serialDevice->println("[ERR] Failed to delete TOTP");
    return false;
}

void createTotpCommands(SimpleCLI *cli) {
    Command totpCmd = cli->addCompositeCmd("totp");
    
    totpCmd.addCommand("list", totpListCallback);
    
    Command addCmd = totpCmd.addCommand("add", totpAddCallback);
    addCmd.addPosArg("name");
    addCmd.addPosArg("secret");
    
    Command addUriCmd = totpCmd.addCommand("add_uri", totpAddUriCallback);
    addUriCmd.addPosArg("uri");
    
    Command delCmd = totpCmd.addCommand("delete", totpDeleteCallback);
    delCmd.addPosArg("index");
}

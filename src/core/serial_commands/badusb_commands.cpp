#include "badusb_commands.h"
#include "core/sd_functions.h"
#include "helpers.h"
#include "modules/badusb_ble/ducky_typer.h"

uint32_t badusbFileCallback(cmd *c) {
#ifndef LITE_VERSION
    // badusb run_from_file HelloWorld.txt

    Command cmd(c);

    Argument arg = cmd.getArgument("filepath");
    String filepath = arg.getValue();
    filepath.trim();

    if (filepath.indexOf(".txt") == -1) {
        serialDevice->println("Invalid filename");
        return false;
    }
    if (!filepath.startsWith("/")) filepath = "/" + filepath;

    FS *fs;
    if (!getFsStorage(fs)) return false;

    if (!(*fs).exists(filepath)) {
        serialDevice->println("File does not exist");
        return false;
    }

#ifdef USB_as_HID
    ducky_startKb(hid_usb, false);
    key_input(*fs, filepath, hid_usb);
    delete hid_usb;
    hid_usb = nullptr;

    // TODO: need to reinit serial when finished
    // Kb.end();
    // USB.~ESPUSB(); // Explicit call to destructor
    // serialDevice->begin(115200);

    return true;
#else
    return false;
#endif
#else
    return false;
#endif
}

uint32_t badusbBufferCallback(cmd *c) {
#ifndef LITE_VERSION
    if (!(_setupPsramFs())) return false;

    char *txt = _readFileFromSerial();
    String tmpfilepath = "/tmpramfile"; // TODO: Change to use char *txt directly
    File f = PSRamFS.open(tmpfilepath, FILE_WRITE);
    if (!f) return false;

    f.write((const uint8_t *)txt, strlen(txt));
    f.close();
    free(txt);

#ifdef USB_as_HID
    ducky_startKb(hid_usb, false);
    key_input(PSRamFS, tmpfilepath, hid_usb);
    delete hid_usb;
    hid_usb = nullptr;

    PSRamFS.remove(tmpfilepath);
    return true;
#else
    PSRamFS.remove(tmpfilepath);
    return false;
#endif
#else
    return false;
#endif
}

uint32_t badusbKbStartCallback(cmd *c) {
#ifndef LITE_VERSION
    ducky_startKb(hid_usb, false, 0); // 0 = Keyboard
    return true;
#else
    return false;
#endif
}

uint32_t badusbKbStopCallback(cmd *c) {
#ifndef LITE_VERSION
    if (hid_usb != nullptr) {
        delete hid_usb;
        hid_usb = nullptr;
    }
    return true;
#else
    return false;
#endif
}

uint32_t badusbKbTypeCallback(cmd *c) {
#ifndef LITE_VERSION
    Command cmd(c);
    String text = cmd.getArgument("text").getValue();
    if (hid_usb == nullptr) { ducky_startKb(hid_usb, false, 0); }
    if (hid_usb != nullptr) {
        hid_usb->print(text.c_str());
    }
    return true;
#else
    return false;
#endif
}

uint32_t badusbKbPressCallback(cmd *c) {
#ifndef LITE_VERSION
    Command cmd(c);
    String key1_str = cmd.getArgument("key1").getValue();
    String key2_str = cmd.getArgument("key2").getValue();
    String key3_str = cmd.getArgument("key3").getValue();

    if (hid_usb == nullptr) { ducky_startKb(hid_usb, false, 0); }
    if (hid_usb != nullptr) {
        if (key1_str.length() > 0) hid_usb->press(key1_str.toInt());
        if (key2_str.length() > 0) hid_usb->press(key2_str.toInt());
        if (key3_str.length() > 0) hid_usb->press(key3_str.toInt());
        hid_usb->releaseAll();
    }
    return true;
#else
    return false;
#endif
}

void createBadUsbCommands(SimpleCLI *cli) {
#ifndef LITE_VERSION
    Command badusbCmd = cli->addCompositeCmd("bu,badusb");

    Command fileCmd = badusbCmd.addCommand("run_from_file", badusbFileCallback);
    fileCmd.addPosArg("filepath");

    Command bufferCmd = badusbCmd.addCommand("run_from_buffer", badusbBufferCallback);

    Command startCmd = badusbCmd.addCommand("kb_start", badusbKbStartCallback);
    Command stopCmd = badusbCmd.addCommand("kb_stop", badusbKbStopCallback);
    
    Command typeCmd = badusbCmd.addCommand("kb_type", badusbKbTypeCallback);
    typeCmd.addPosArg("text");

    Command pressCmd = badusbCmd.addCommand("kb_press", badusbKbPressCallback);
    pressCmd.addPosArg("key1", "");
    pressCmd.addPosArg("key2", "");
    pressCmd.addPosArg("key3", "");
#endif
}

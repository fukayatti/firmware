#if !defined(LITE_VERSION)
#include "BLESerialService.h"
#include "modules/ble/ble_common.h" // bleNotifyRetry
#include <NimBLEDevice.h>

BLESerialService::BLESerialService() : BruceBLEService() {}

BLESerialService::~BLESerialService() {}

class BLESerialCallbacks : public NimBLECharacteristicCallbacks {
    BLESerialService* service;
public:
    BLESerialCallbacks(BLESerialService* s) : service(s) {}
    void onWrite(NimBLECharacteristic *pCharacteristic, NimBLEConnInfo &connInfo) override {
        service->appendRx((std::string)pCharacteristic->getValue());
    }
};

void BLESerialService::appendRx(const std::string& data) {
    portENTER_CRITICAL(&rx_mux);
    rx_buffer += String(data.c_str(), data.length());
    portEXIT_CRITICAL(&rx_mux);
}

void BLESerialService::setup(NimBLEServer *pServer) {
    pService = pServer->createService("4371ec0b-3d43-49f9-b731-7c72a4a7bb91");

    serial_char = pService->createCharacteristic(
        "d555ed97-bf2a-4f46-b3eb-d1fcdd7325e9", // Battery Level
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::WRITE
    );

    callbacks = new BLESerialCallbacks(this);
    serial_char->setCallbacks(callbacks);

    pService->start();
    pServer->getAdvertising()->addServiceUUID(pService->getUUID());
}

void BLESerialService::end() { delete callbacks; }

int BLESerialService::available() {
    portENTER_CRITICAL(&rx_mux);
    int len = rx_buffer.length();
    portEXIT_CRITICAL(&rx_mux);
    return len;
}

size_t BLESerialService::println(const String &s) {
    String toSend = s + "\r\n";
    return this->write((uint8_t*)toSend.c_str(), toSend.length());
}

size_t BLESerialService::print(const String &s) {
    return this->write((uint8_t*)s.c_str(), s.length());
}

size_t BLESerialService::println(size_t n) {
    String s = String(n);
    return println(s);
}

void BLESerialService::vprintf(const char *fmt, va_list args) {
    int size = vsnprintf(NULL, 0, fmt, args) + 1;
    char str[BUFFER_SIZE];
    sprintf(str, fmt, args);

    this->write((uint8_t*)str, size - 1);
}

String BLESerialService::readStringUntil(char terminator) {
    portENTER_CRITICAL(&rx_mux);
    int idx = rx_buffer.indexOf(terminator);
    String result = "";
    if (idx >= 0) {
        result = rx_buffer.substring(0, idx);
        rx_buffer = rx_buffer.substring(idx + 1);
    } else {
        // If terminator not found, we don't return partial buffer.
        // wait for the terminator to arrive in the next chunks.
        // Wait, standard Arduino readStringUntil returns the buffer if timeout occurs,
        // but since we want to handle chunking, returning empty here might cause issues if caller
        // expects partial string. Let's return empty and let caller wait.
        // Actually, if we return empty, the caller might think nothing was read.
        // serialcmds.cpp does: String cmd_str = serialDevice->readStringUntil('\n'); 
        // and if it's empty, it returns. This is exactly what we want: wait for '\n'.
    }
    portEXIT_CRITICAL(&rx_mux);
    return result;
}

size_t BLESerialService::println(const uint32_t n) {
    String s = String(n);
    return println(s);
}

size_t BLESerialService::print(const int n, int format) {
    String s = String(n, format);
    return print(s);
}

size_t BLESerialService::println(const int n, int format) {
    String s = String(n, format);
    return println(s);
}

size_t BLESerialService::println() { return println(""); }

size_t BLESerialService::write(uint8_t *str, size_t size) {
    size_t offset = 0;
    uint16_t chunk_size = (this->mtu > 3) ? (this->mtu - 3) : 20;
    while (offset < size) {
        size_t send_size = size - offset;
        if (send_size > chunk_size) {
            send_size = chunk_size;
        }
        bleNotifyRetry(serial_char, str + offset, send_size);
        offset += send_size;
        vTaskDelay(pdMS_TO_TICKS(5));
    }
    return size;
}

int BLESerialService::read() {
    portENTER_CRITICAL(&rx_mux);
    int c = -1;
    if (rx_buffer.length() > 0) {
        c = rx_buffer.charAt(0);
        rx_buffer = rx_buffer.substring(1);
    }
    portEXIT_CRITICAL(&rx_mux);
    return c;
}

void BLESerialService::setMTU(uint16_t mtu) { this->mtu = mtu; }

#endif

/**
 * UI Telemetry Engine & Performance Monitor
 * Autor: Chibercea Daniel | Expert RC 251
 * Data: 15.05.2026 | No-Dependency GDPR Beacon
 */

(function() {
    'use strict';

    // Initializarea obiectului de telemetrie
    const telemetryData = {
        appId: typeof __app_id !== 'undefined' ? __app_id : 'RC251-UTM-PORTFOLIO',
        timestamp: new Date().toISOString(),
        environment: {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A', // Cores CPU
            deviceMemory: navigator.deviceMemory || 'N/A',               // Memorie RAM in GB
            networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        },
        performanceMetrics: {},
        errors: [],       // Array pentru erorile capturate (Dynamic Error Tracking)
        fid: null         // First Input Delay estimat (Core Web Vitals)
    };

    // -------------------------------------------------------------------------
    // FUNCTIA DE COLECTARE A METRICILOR DIN API-UL PERFORMANCE AL BROWSERULUI
    // -------------------------------------------------------------------------
    function collectPerformanceMetrics() {
        if (!window.performance || !window.performance.getEntriesByType) return;

        // Metricile de Navigatie (TTFB, DNS, TCP etc.)
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            const timing = navEntries[0];
            telemetryData.performanceMetrics.dnsTime       = timing.domainLookupEnd - timing.domainLookupStart;
            telemetryData.performanceMetrics.tcpHandshake  = timing.connectEnd - timing.connectStart;
            telemetryData.performanceMetrics.ttfb          = timing.responseStart - timing.requestStart;
            telemetryData.performanceMetrics.domInteractive = timing.domInteractive;
            telemetryData.performanceMetrics.loadEvent     = timing.loadEventEnd - timing.loadEventStart;
        }

        // Metricile de Randare (First Paint, First Contentful Paint)
        const paintEntries = window.performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
            if (entry.name === 'first-paint') {
                telemetryData.performanceMetrics.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                telemetryData.performanceMetrics.firstContentfulPaint = entry.startTime;
            }
        });

        dispatchTelemetry();
    }

    // -------------------------------------------------------------------------
    // TRIMITEREA DATELOR FOLOSIND navigator.sendBeacon (GDPR - fara PII)
    // -------------------------------------------------------------------------
    function dispatchTelemetry() {
        const payload  = JSON.stringify(telemetryData);
        const endpoint = "https://analytics.rc251.utm.md/api/telemetry"; // URL simulat UTM

        console.log(
            "%c[TELEMETRIE ACTIVE] Structura JSON trimisa:",
            "color: #00f2ff; font-weight: bold;",
            telemetryData
        );

        if (navigator.sendBeacon) {
            // Metoda preferata: asincrona, non-blocanta, functioneaza si dupa inchiderea tab-ului
            navigator.sendBeacon(endpoint, payload);
        } else {
            // Fallback pentru browsere legacy care nu suporta sendBeacon
            const xhr = new XMLHttpRequest();
            xhr.open("POST", endpoint, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(payload);
        }
    }

    // -------------------------------------------------------------------------
    // SARCINA 1: DYNAMIC ERROR TRACKING (window.onerror)
    // Capteaza orice eroare JS aparuta pe pagina si trimite automat un beacon
    // -------------------------------------------------------------------------
    window.onerror = function(message, source, lineno, colno, error) {
        const errorInfo = {
            message: message,           // Mesajul erorii
            source:  source,            // Fisierul unde a aparut eroarea
            line:    lineno,            // Linia exacta
            column:  colno,             // Coloana exacta
            stack:   error ? error.stack : 'N/A', // Stack trace complet
            timestamp: new Date().toISOString()
        };

        // Adaugam eroarea in obiectul de telemetrie
        telemetryData.errors.push(errorInfo);

        console.warn(
            "%c[TELEMETRIE ERROR] Eroare capturata si trimisa:",
            "color: #ff4444; font-weight: bold;",
            errorInfo
        );

        // Trimitem imediat un beacon cu eroarea, fara a astepta evenimentul load
        dispatchTelemetry();

        // Returnam false pentru a nu suprima afisarea erorii in consola
        return false;
    };

    // -------------------------------------------------------------------------
    // SARCINA 2: CORE WEB VITALS - FID ESTIMATION (First Input Delay)
    // Masuram timpul dintre click-ul fizic al utilizatorului si executia handler-ului
    // -------------------------------------------------------------------------
    function measureFID(event) {
        // startTime = momentul fizic al evenimentului inregistrat de browser
        const fidValue = performance.now() - event.timeStamp;

        telemetryData.fid = {
            value: fidValue.toFixed(2),  // Valoarea FID in milisecunde
            unit: 'ms',
            rating: fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor'
        };

        console.log(
            "%c[TELEMETRIE FID] First Input Delay estimat:",
            "color: #00ff88; font-weight: bold;",
            telemetryData.fid
        );

        // Dupa primul click, eliminam listener-ul (nu mai avem nevoie de el)
        document.removeEventListener('click', measureFID);

        // Trimitem beacon cu datele FID actualizate
        dispatchTelemetry();
    }

    // Inregistram listener-ul pe primul click al utilizatorului
    document.addEventListener('click', measureFID, { once: true });

    // -------------------------------------------------------------------------
    // SARCINA 3: LIGHTHOUSE OPTIMIZATION - requestIdleCallback
    // Amanam executia scriptului pana cand browserul este complet liber
    // pentru a nu afecta scorul de Performance in Lighthouse
    // -------------------------------------------------------------------------
    window.addEventListener('load', function() {
        if ('requestIdleCallback' in window) {
            // Browserul este modern si suporta requestIdleCallback
            // Executam colectarea metricilor DOAR cand browserul nu are alte sarcini
            requestIdleCallback(function(deadline) {
                // deadline.timeRemaining() ne spune cat timp liber are browserul
                if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
                    setTimeout(collectPerformanceMetrics, 500);
                }
            }, { timeout: 3000 }); // Maximum 3 secunde de asteptare
        } else {
            // Fallback pentru browsere care nu suporta requestIdleCallback (ex: Safari vechi)
            setTimeout(collectPerformanceMetrics, 500);
        }
    });

})();

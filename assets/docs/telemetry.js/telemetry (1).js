/**
 * UI Telemetry Engine & Performance Monitor
 * Autor: Chibercea Daniel | Expert RC 251
 * Data: 15.05.2026 | No-Dependency GDPR Beacon
 * Actualizat: 19.05.2026 | Web Storage Integration (GDPR Compliant)
 */
// State Preservation Engineering: Web Storage Persistence validated by: Chibercea Daniel | 19.05.2026

(function() {
    'use strict';

    // -------------------------------------------------------------------------
    // GDPR OPT-OUT - verificam daca utilizatorul a refuzat telemetria
    // -------------------------------------------------------------------------
    const optOut = localStorage.getItem('utm_telemetry_optout');
    if (optOut === 'true') {
        console.log('%c[TELEMETRIE DEZACTIVATA - GDPR Opt-Out activ]', 'color: #ff4444; font-weight: bold;');
        return;
    }

    // -------------------------------------------------------------------------
    // WEB STORAGE - Numarul de vizite (localStorage - persistent)
    // -------------------------------------------------------------------------
    let visitCount;
    try {
        let raw = localStorage.getItem('utm_telemetry_visits');
        if (raw === null) {
            visitCount = 1;
        } else {
            visitCount = parseInt(raw, 10);
            if (isNaN(visitCount)) {
                console.warn('[TELEMETRIE] Valoare corupta detectata in storage. Reset la starea initiala.');
                visitCount = 1;
            } else {
                visitCount = visitCount + 1;
            }
        }
        localStorage.setItem('utm_telemetry_visits', visitCount);
    } catch(e) {
        console.error('[TELEMETRIE] Eroare la accesarea localStorage:', e);
        visitCount = 1;
    }

    // -------------------------------------------------------------------------
    // WEB STORAGE - Ora startului sesiunii (sessionStorage - volatil)
    // -------------------------------------------------------------------------
    let sessionStartTime;
    try {
        sessionStartTime = sessionStorage.getItem('utm_session_start_time');
        if (sessionStartTime === null) {
            const now = new Date();
            sessionStartTime = now.toTimeString().split(' ')[0];
            sessionStorage.setItem('utm_session_start_time', sessionStartTime);
            sessionStorage.setItem('utm_session_start_ms', now.getTime().toString());
        }
    } catch(e) {
        console.error('[TELEMETRIE] Eroare la accesarea sessionStorage:', e);
        sessionStartTime = 'N/A';
    }

    // Initializarea obiectului de telemetrie
    const telemetryData = {
        appId: typeof __app_id !== 'undefined' ? __app_id : 'RC251-UTM-PORTFOLIO',
        timestamp: new Date().toISOString(),
        userProfile: {
            historicalVisits: visitCount,
            sessionStartedAt: sessionStartTime,
            isNewUser: visitCount === 1
        },
        environment: {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
            deviceMemory: navigator.deviceMemory || 'N/A',
            networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            language: navigator.language
        },
        performanceMetrics: {},
        errors: [],
        fid: null
    };

    // -------------------------------------------------------------------------
    // FUNCTIA DE COLECTARE A METRICILOR DIN API-UL PERFORMANCE AL BROWSERULUI
    // -------------------------------------------------------------------------
    function collectPerformanceMetrics() {
        if (!window.performance || !window.performance.getEntriesByType) return;

        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            const timing = navEntries[0];
            telemetryData.performanceMetrics.dnsTime        = timing.domainLookupEnd - timing.domainLookupStart;
            telemetryData.performanceMetrics.tcpHandshake   = timing.connectEnd - timing.connectStart;
            telemetryData.performanceMetrics.ttfb           = timing.responseStart - timing.requestStart;
            telemetryData.performanceMetrics.domInteractive = timing.domInteractive;
            telemetryData.performanceMetrics.loadEvent      = timing.loadEventEnd - timing.loadEventStart;
        }

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
        const endpoint = "https://analytics.rc251.utm.md/api/telemetry";

        console.group("%c[TELEMETRIE PERSISTENTA ACTIVA]", "color: #00f2ff; font-weight: bold; font-size: 11px;");
        console.log(`%cUtilizatorul se afla la vizita: %c${visitCount}`, "color: #ffffff;", "color: #00ff66; font-weight: bold;");
        console.log(`%cSesiunea curenta a inceput la ora: %c${sessionStartTime}`, "color: #ffffff;", "color: #ffcc00; font-weight: bold;");
        console.log("Payload complet trimis la Beacon:", telemetryData);
        console.groupEnd();

        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, payload);
        } else {
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
            message: message,
            source:  source,
            line:    lineno,
            column:  colno,
            stack:   error ? error.stack : 'N/A',
            timestamp: new Date().toISOString()
        };

        telemetryData.errors.push(errorInfo);

        console.warn(
            "%c[TELEMETRIE ERROR] Eroare capturata si trimisa:",
            "color: #ff4444; font-weight: bold;",
            errorInfo
        );

        dispatchTelemetry();
        return false;
    };

    // -------------------------------------------------------------------------
    // SARCINA 2: CORE WEB VITALS - FID ESTIMATION (First Input Delay)
    // Masuram timpul dintre click-ul fizic al utilizatorului si executia handler-ului
    // -------------------------------------------------------------------------
    function measureFID(event) {
        const fidValue = performance.now() - event.timeStamp;

        telemetryData.fid = {
            value: fidValue.toFixed(2),
            unit: 'ms',
            rating: fidValue < 100 ? 'good' : fidValue < 300 ? 'needs-improvement' : 'poor'
        };

        console.log(
            "%c[TELEMETRIE FID] First Input Delay estimat:",
            "color: #00ff88; font-weight: bold;",
            telemetryData.fid
        );

        document.removeEventListener('click', measureFID);
        dispatchTelemetry();
    }

    document.addEventListener('click', measureFID, { once: true });

    // -------------------------------------------------------------------------
    // SESSION DURATION ESTIMATOR - calculam durata exacta la inchiderea paginii
    // Durata (sec) = Ora Inchiderii - Ora Deschiderii (sessionStorage)
    // -------------------------------------------------------------------------
    window.addEventListener('beforeunload', function() {
        try {
            const startMs = parseInt(sessionStorage.getItem('utm_session_start_ms'), 10);
            if (!isNaN(startMs)) {
                const durataSec = Math.round((Date.now() - startMs) / 1000);

                let istoricRaw = localStorage.getItem('utm_durate_sesiuni');
                let istoricDurate = [];
                try {
                    istoricDurate = istoricRaw ? JSON.parse(istoricRaw) : [];
                    if (!Array.isArray(istoricDurate)) istoricDurate = [];
                } catch(e) {
                    istoricDurate = [];
                }

                istoricDurate.push(durataSec);
                localStorage.setItem('utm_durate_sesiuni', JSON.stringify(istoricDurate));

                const medie = Math.round(istoricDurate.reduce((a, b) => a + b, 0) / istoricDurate.length);
                console.log(`[TELEMETRIE] Durata sesiunii: ${durataSec}s | Media istorica: ${medie}s`);
            }
        } catch(e) {
            console.error('[TELEMETRIE] Eroare la calculul duratei sesiunii:', e);
        }
    });

    // -------------------------------------------------------------------------
    // SARCINA 3: LIGHTHOUSE OPTIMIZATION - requestIdleCallback
    // Amanam executia scriptului pana cand browserul este complet liber
    // -------------------------------------------------------------------------
    window.addEventListener('load', function() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(function(deadline) {
                if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
                    setTimeout(collectPerformanceMetrics, 500);
                }
            }, { timeout: 3000 });
        } else {
            setTimeout(collectPerformanceMetrics, 500);
        }
    });

})();


// -------------------------------------------------------------------------
// GDPR OPT-OUT FEATURE - checkbox din footer (GDPR Compliant)
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const checkbox = document.getElementById('gdpr-optout');
    if (!checkbox) return;

    checkbox.checked = localStorage.getItem('utm_telemetry_optout') === 'true';

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('utm_telemetry_optout', 'true');
            console.log('%c[GDPR] Telemetria a fost dezactivata. Storage curatat.', 'color: #ff4444; font-weight: bold;');
        } else {
            localStorage.removeItem('utm_telemetry_optout');
            console.log('%c[GDPR] Telemetria a fost reactivata.', 'color: #00ff66; font-weight: bold;');
        }
    });
});

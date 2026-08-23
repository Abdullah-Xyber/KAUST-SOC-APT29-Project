# Validation Metrics

## Overview

The effectiveness of the APT29 adversary-emulation and defensive workflow was evaluated using five SOC performance metrics:

* Mean Time to Detect (MTTD)
* Mean Time to Contain (MTTC)
* Mean Time to Remediate (MTTR)
* MITRE ATT&CK Technique Coverage
* False-Positive Rate (FPR)

These metrics provide a quantitative view of how effectively the environment detected and responded to the emulated attack.

Not all metrics were obtained using the same evidence type. **MTTD and MITRE ATT&CK coverage were measured directly** from the final attack-chain execution and Elastic Security telemetry. **MTTC, MTTR, and FPR are procedure-based or preliminary estimates** derived from the documented incident-response workflow and detection-rule tuning.

---

# Metrics Summary

| Metric                          |             Result | Evidence Status                |
| ------------------------------- | -----------------: | ------------------------------ |
| Mean Time to Detect (MTTD)      |   **18.4 seconds** | Measured                       |
| Mean Time to Contain (MTTC)     |   **~2.1 minutes** | Procedure-based estimate       |
| Mean Time to Remediate (MTTR)   |   **~5.6 minutes** | Procedure-based estimate       |
| MITRE ATT&CK Technique Coverage | **11 / 11 = 100%** | Measured within selected scope |
| False-Positive Rate (FPR)       |          **~8.5%** | Preliminary estimate           |

---

# 1. Mean Time to Detect (MTTD)

## Definition

Mean Time to Detect measures the average time between execution of an emulated adversary technique and generation of the corresponding Elastic Security alert.

For each technique:

```text
Detection Time =
Alert Timestamp - Technique Execution Timestamp
```

The overall MTTD is calculated as:

```text
             Σ Detection Time
MTTD = -----------------------------
        Number of Detected Techniques
```

For the final validated attack chain:

```text
Detected techniques = 11
MTTD = 18.4 seconds
```

Therefore:

```text
MTTD = 18.4 seconds
```

## Evidence Sources

The calculation used timestamps from:

```text
CALDERA operation
        +
Elastic Security alert feed
```

The CALDERA execution timestamp represents the start of the emulated technique, while the corresponding Elastic alert timestamp represents detection.

## Interpretation

An average MTTD below twenty seconds demonstrates that the selected behaviors were detected quickly within the lab environment.

The result was influenced by:

* High-fidelity endpoint telemetry
* PowerShell Script Block Logging
* Sysmon telemetry
* Elastic Agent forwarding
* Detection rules configured with a one-minute execution interval

**Evidence status: Measured**

---

# 2. Mean Time to Contain (MTTC)

## Definition

Mean Time to Contain represents the time required to move from confirmed detection of the intrusion to successful containment of the affected systems and identity.

Conceptually:

```text
MTTC =
Containment Completion Time
-
Confirmed Incident Time
```

The containment workflow included:

```text
Confirm compromised host
        |
        v
Disable WS01 network adapter
        |
        v
Stop CALDERA agent
        |
        v
Disable compromised AD account
```

The resulting estimate was:

```text
MTTC ≈ 2.1 minutes
```

## Containment Actions

The procedure included:

```powershell
Disable-NetAdapter -Name "Ethernet" -Confirm:$false
```

```powershell
Get-Process splunkd -ErrorAction SilentlyContinue |
Stop-Process -Force
```

```powershell
Disable-ADAccount -Identity "ws01"
```

## Interpretation

The value represents the expected execution time of the documented containment workflow in the controlled lab.

It should **not** be interpreted as a statistically measured production SOC containment time because the incident was scripted and the responders already knew the lab environment and response procedure.

**Evidence status: Procedure-based estimate**

---

# 3. Mean Time to Remediate (MTTR)

## Definition

Mean Time to Remediate represents the time required to remove identified adversary artifacts and restore the affected environment after containment.

Conceptually:

```text
MTTR =
Remediation Completion Time
-
Containment Start Time
```

The remediation process included:

```text
Remove Registry persistence
        |
        v
Remove Scheduled Task
        |
        v
Remove WMI persistence
        |
        v
Remove Mimikatz
        |
        v
Remove CALDERA agents
        |
        v
Remove staging files
        |
        v
Reset credentials
        |
        v
Restore WS01 network
```

The procedure-based result was:

```text
MTTR ≈ 5.6 minutes
```

## Interpretation

The result represents the approximate time required to execute the documented eradication and recovery procedure in the controlled lab.

As with MTTC, this was not measured during an unscripted production incident.

**Evidence status: Procedure-based estimate**

---

# 4. MITRE ATT&CK Technique Coverage

## Definition

ATT&CK coverage measures the percentage of selected emulated techniques that generated a validated detection.

The calculation is:

```text
                    Detected Techniques
ATT&CK Coverage = ------------------------ × 100
                    Emulated Techniques
```

The final attack chain contained:

```text
Emulated techniques = 11
Detected techniques = 11
```

Therefore:

```text
ATT&CK Coverage =
11 / 11 × 100

ATT&CK Coverage = 100%
```

## Result

```text
11 / 11 techniques detected
100% coverage
```

This means every technique included in the **selected final emulation scope** produced corresponding detection evidence.

## Important Scope Limitation

The result does **not** mean that the environment provides 100% detection coverage for all APT29 techniques or for the entire MITRE ATT&CK framework.

It means:

> 100% of the eleven techniques selected and executed in this project were detected.

**Evidence status: Measured within selected scope**

---

# 5. False-Positive Rate

## Definition

The False-Positive Rate estimates how much of the observed detection activity during rule development represented benign behavior rather than the emulated attack.

The general calculation used is:

```text
                  False Positive Alerts
FPR = --------------------------------------------- × 100
      Total Alerts Reviewed During Validation
```

The project produced a preliminary estimate of:

```text
FPR ≈ 8.5%
```

## False-Positive Sources

During rule development and tuning, several legitimate processes produced behavior similar to attack activity.

Examples included:

```text
OneDriveSetup.exe
OneDriveStandaloneUpdater.exe
FileCoAuth.exe
DismHost.exe
```

These processes generated activity from locations or through behaviors that initially matched suspicious detection logic.

Each case was investigated before exclusions were introduced.

## Interpretation

The approximately 8.5% FPR should be considered a **preliminary estimate** rather than a production-quality statistical measurement.

The lab environment contained substantially less normal user and application activity than a production enterprise network.

A real SOC deployment would require a larger observation period and substantially more benign traffic before calculating a statistically meaningful false-positive rate.

**Evidence status: Preliminary estimate**

---

# Evidence Classification

An important part of interpreting these metrics is understanding how they were obtained.

## Directly Measured

The following metrics were supported by timestamped evidence from the final emulation:

```text
MTTD
MITRE ATT&CK Coverage
```

They were derived from:

```text
CALDERA execution evidence
          +
Elastic Security alerts
```

---

## Procedure-Based Estimates

The following metrics were based on the documented incident-response workflow:

```text
MTTC
MTTR
```

They represent the approximate time required to execute the containment, eradication, and recovery procedures in the controlled lab.

---

## Preliminary Estimate

The following metric was derived from false-positive observations made during rule tuning:

```text
False-Positive Rate
```

It should therefore be interpreted as directional rather than statistically rigorous.

---

# Security Dashboard

A dedicated Kibana dashboard was created to provide a high-level view of the final attack-chain results.

The dashboard summarized:

* Alert volume by rule
* Alert distribution by host
* Alert severity
* MITRE ATT&CK technique coverage

![Kibana Security Overview](../diagrams/validation-metrics/security-overview-dashboard.png)

*Kibana security overview dashboard summarizing alert volume, severity distribution, and ATT&CK technique coverage from the final attack-chain execution.*

---

# Overall Validation Result

The final validation demonstrated:

```text
11 selected techniques emulated
           |
           v
11 techniques detected
           |
           v
39 Elastic Security alerts
           |
           v
MTTD = 18.4 seconds
           |
           v
MTTC ≈ 2.1 minutes
           |
           v
MTTR ≈ 5.6 minutes
           |
           v
ATT&CK Coverage = 100%
           |
           v
FPR ≈ 8.5%
```

Overall, the results demonstrate strong detection performance within the controlled scope of the project.

The measured metrics confirm that all selected techniques generated detection evidence, while the procedure-based metrics provide an initial indication of how quickly the documented incident-response workflow could contain and remediate the simulated intrusion.

The results should be interpreted within the limitations of the isolated lab environment rather than generalized directly to production SOC performance.


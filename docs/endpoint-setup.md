Windows Victim Endpoints Setup and Telemetry Validation

Overview

This document describes the individual technical contribution of Essam Shaker Alsulayyih to the KAUST Academy cybersecurity capstone project, Real-World Cyberattack Emulation, Threat Hunting and Remediation.

The primary responsibility was the preparation, configuration, troubleshooting, and telemetry validation of the two Windows victim endpoints, WS01 and WS02, used in the controlled APT29-inspired enterprise attack simulation.

 Responsibilities

* Prepared and configured the Windows victim machines WS01 and WS02.
* Configured IP addressing, DNS, and virtual network adapters.
* Joined the endpoints to the CORP Active Directory domain.
* Verified connectivity with the Domain Controller, Elastic Security server, and MITRE CALDERA server.
* Installed and configured Elastic Agent on the endpoints.
* Enabled Sysmon and PowerShell logging to improve endpoint visibility.
* Validated that endpoint telemetry was successfully forwarded to Elastic Security.
* Prepared safe test data and endpoint conditions for adversary-emulation activities.
* Investigated and validated local artifacts generated during authorized attack simulations.
* Troubleshot network connectivity, agent enrollment, and virtual machine configuration issues.

Lab Environment

The endpoints were part of an isolated enterprise-style lab containing the following components:

| Component | Purpose                                  |
| --------- | ---------------------------------------- |
| WS01      | Windows victim endpoint                  |
| WS02      | Windows victim endpoint                  |
| DC01      | Active Directory Domain Controller       |
| ELASTIC01 | Elastic Security, Kibana, and Fleet      |
| CALDERA01 | MITRE CALDERA adversary-emulation server |

The lab used the CORP domain and an internal virtual network to support controlled attack simulation and defensive monitoring.

 Endpoint Preparation

 Network and Domain Configuration

The Windows endpoints were configured with appropriate IP addressing, DNS settings, and network adapter configurations. Connectivity was tested between the victim machines and the other lab components.

Both WS01 and WS02 were joined to the CORP domain. Domain connectivity and name resolution were verified before proceeding with security agent deployment and attack simulation.

 Elastic Agent Deployment

Elastic Agent was installed on the victim endpoints and enrolled into the appropriate Fleet policies. Agent communication with Elastic Security was verified, and enrollment or connectivity issues were troubleshot when necessary.

The objective was to ensure that endpoint events could be collected centrally and used for security monitoring and investigation.

 Sysmon and PowerShell Logging

Sysmon and PowerShell logging were configured to provide additional visibility into endpoint activity.

The telemetry configuration supported investigation of security-relevant behaviors such as:

* Process creation and parent-child process relationships.
* PowerShell execution and script activity.
* Network connections associated with endpoint processes.
* Windows security events and authentication-related activity.
* Local artifacts generated during the authorized simulations.

 Telemetry Validation

Before executing attack scenarios, the endpoints were checked to ensure that the required logging and monitoring components were functioning correctly.

Validation activities included:

1. Confirming that the endpoints were reachable on the lab network.
2. Verifying domain connectivity and DNS resolution.
3. Checking Elastic Agent enrollment and health.
4. Confirming that Windows and Sysmon events were available in Elastic.
5. Verifying that PowerShell logging was enabled.
6. Generating safe test activity and checking that the corresponding telemetry could be observed.
7. Confirming that the endpoints were ready for the planned adversary-emulation scenarios.

 Attack Simulation Support

The victim machines were prepared to support authorized APT29-inspired adversary-emulation activities conducted by the project team.

During the simulations, endpoint activity was monitored and local artifacts were examined to support the investigation of suspicious behavior. This included validating process execution, Windows logging, and other evidence relevant to the attack chain.

One of the investigated scenarios involved suspicious PowerShell activity following execution through a legitimate Windows utility. The collected telemetry helped the team reconstruct the process chain and correlate endpoint activity with Elastic Security alerts.

 Challenges and Troubleshooting

Several technical challenges were encountered during endpoint preparation and integration, including:

* Virtual network adapter configuration and connectivity issues.
* DNS and domain connectivity problems.
* Communication between the victim machines and the Elastic/Fleet infrastructure.
* Elastic Agent enrollment and telemetry forwarding issues.
* Virtual machine performance and resource limitations.
* Clipboard and file-sharing limitations in the virtualized environment.
* Dependencies and configuration requirements for some adversary-emulation activities.

These issues were addressed through systematic connectivity testing, configuration verification, service checks, agent re-enrollment when required, and the use of virtual machine snapshots for safe rollback.

Outcome

The endpoint preparation and validation work helped establish a functioning monitored environment for the team's APT29-inspired attack simulations.

The main contribution was ensuring that WS01 and WS02 were correctly configured, connected to the enterprise lab, and capable of producing useful telemetry for Elastic Security investigation.

This work strengthened practical skills in Windows endpoint administration, Active Directory integration, virtual networking, SIEM telemetry collection, troubleshooting, and SOC-style security monitoring.



Essam Shaker Alsulayyih
Cybersecurity Student — Imam Abdulrahman Bin Faisal University
KAUST Academy Cybersecurity Specialization Program, Summer 2026

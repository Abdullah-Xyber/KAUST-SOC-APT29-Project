# ⚠️ Challenges and Lessons Learned

## Overview

Building the APT29 adversary-emulation and detection environment required the integration of multiple virtual machines, operating systems, security platforms, and network services.

Several technical challenges occurred during deployment and testing. Resolving these issues improved the team’s understanding of SOC infrastructure, endpoint monitoring, adversary emulation, detection engineering, and incident response.

> [!NOTE]
> Sensitive network details, credentials, and unnecessary system information have been excluded from this document.

---

## Challenges Summary

| Challenge | Impact | Resolution |
|:---|:---|:---|
| Virtual-machine networking | Systems could not communicate reliably | Migrated to an isolated internal virtual network |
| Campus network restrictions | Bridged communication between laptops was blocked | Used a controlled virtual-network configuration |
| CALDERA connectivity | Agents could not consistently reach the server | Verified routing, ports, agent commands, and server availability |
| CALDERA agent availability | Agents appeared alive and later became inactive | Reviewed network stability, running processes, and connection settings |
| WinRM permissions | Remote commands returned access-denied errors | Corrected credentials, permissions, and Windows remote-management policies |
| Elastic Agent and Fleet | Some agents appeared unhealthy or disconnected | Verified Fleet configuration, service status, and network connectivity |
| Delayed telemetry | Events and alerts did not always appear immediately | Confirmed ingestion status and allowed time for event processing |
| Incomplete Windows logging | Some attack activity lacked sufficient visibility | Enabled advanced auditing, PowerShell logging, and Sysmon |
| Time inconsistency | CALDERA and Elastic timestamps were difficult to correlate | Synchronized the systems’ date, time, and time zone |
| Detection-rule tuning | Initial queries could create noise or miss activity | Refined filters using observed attack telemetry |
| False-positive identification | Legitimate administration resembled malicious activity | Compared alerts with CALDERA records and system context |
| Multi-system coordination | Configuration differences affected testing | Assigned roles and used shared documentation and validation steps |

---

## 1. Virtual-Machine Networking

### Challenge

The project’s virtual machines were hosted across different physical devices. Communication initially worked through a mobile hotspot, but the same configuration did not operate reliably on the campus wireless network.

Bridged networking and NAT configurations did not provide the required communication between all laboratory systems.

### Impact

The networking problem affected:

- Domain communication
- DNS resolution
- Elastic Agent connectivity
- Fleet enrollment
- CALDERA agent communication
- Remote administration
- Attack execution and telemetry collection

### Resolution

The team moved the systems to an isolated internal virtual network and ensured that all required virtual machines used compatible network settings.

Connectivity was validated before continuing with the project by checking:

- Basic reachability
- DNS resolution
- Required service ports
- Domain communication
- Elastic Fleet connectivity
- CALDERA server accessibility

### Lesson Learned

Network design must be completed and validated before deploying higher-level security services. A stable network is the foundation of Active Directory, telemetry collection, adversary emulation, and incident investigation.

---

## 2. Campus Network Restrictions

### Challenge

The campus wireless network restricted communication between devices. Virtual machines hosted on different laptops could not communicate reliably, even when the physical devices were connected to the same wireless network.

### Impact

The restrictions prevented the distributed laboratory from operating as a single connected environment.

### Resolution

The team avoided depending on the campus network for direct virtual-machine communication and used an isolated laboratory network under the team’s control.

### Lesson Learned

Enterprise and campus wireless networks may enforce client isolation and other controls that prevent peer-to-peer communication. Laboratory designs should not assume that devices connected to the same wireless network can communicate directly.

---

## 3. Active Directory and DNS Configuration

### Challenge

The Windows workstations required reliable communication with the domain controller before they could join the domain and apply Group Policy settings.

Incorrect DNS or network settings could prevent domain discovery and authentication.

### Impact

Domain-join failures would affect:

- Centralized authentication
- Group Policy application
- Audit-policy deployment
- Domain-based attack simulation
- Authentication-event collection

### Resolution

The team configured the domain controller to provide Active Directory and DNS services. The workstations were configured to use the domain environment correctly before being joined to `corp.local`.

### Lesson Learned

Active Directory depends heavily on DNS. Domain connectivity should be verified through name resolution and authentication testing, rather than relying only on successful ping results.

---

## 4. CALDERA Server Connectivity

### Challenge

At one stage, Windows systems could reach the CALDERA server through basic network tests, but connections to the CALDERA service port failed.

### Impact

The CALDERA agents could not:

- Download correctly
- Register with the server
- Receive instructions
- Execute assigned abilities
- Return operation results

### Resolution

The team reviewed:

- CALDERA server status
- Listening ports
- Host firewall rules
- Virtual-network configuration
- Agent server address
- Connectivity between the Windows hosts and CALDERA01

The operation continued only after confirming that the Windows targets could reach the CALDERA service.

### Lesson Learned

A successful ping does not confirm that an application is reachable. Service-specific port testing is required when troubleshooting agent-server communication.

---

## 5. CALDERA Agent Availability

### Challenge

Some CALDERA agents initially appeared as alive but later became inactive or disconnected.

### Impact

Agent disconnections interrupted attack execution and resulted in incomplete operation data.

### Possible Causes Investigated

- Unstable network communication
- CALDERA server unavailability
- Agent process termination
- Incorrect server address
- Host firewall restrictions
- Virtual-machine suspension
- Endpoint restart
- Differences between interactive and background execution

### Resolution

The team verified that:

- The CALDERA server remained operational
- The agent process was still running
- The required port remained accessible
- The target virtual machine was active
- The agent was launched using the correct server information

### Lesson Learned

Agent registration alone does not prove long-term availability. Agent health should be monitored throughout the complete adversary-emulation operation.

---

## 6. WinRM Authentication and Permissions

### Challenge

A CALDERA ability attempted to execute a remote PowerShell command through WinRM but returned an **Access is denied** error.

WinRM was enabled, but the executing account did not initially have the required permissions or usable authentication context.

### Impact

Remote execution and lateral-movement activities could not be completed successfully.

### Resolution

The team reviewed:

- WinRM service status
- Remote-management configuration
- Account credentials
- Administrative permissions
- Domain authentication
- Firewall rules
- PowerShell remoting policies

The activity was repeated after correcting the required access configuration.

### Lesson Learned

An enabled service is not necessarily usable. Successful remote execution requires network access, authentication, authorization, firewall access, and compatible policies.

---

## 7. Elastic Agent and Fleet Connectivity

### Challenge

Elastic Agents did not always remain healthy or consistently connected to Fleet.

### Impact

Disconnected or unhealthy agents could cause:

- Missing endpoint telemetry
- Incomplete investigation evidence
- Delayed alert generation
- Reduced MITRE ATT&CK coverage
- Inaccurate validation results

### Resolution

The team checked:

- Elastic Agent service status
- Fleet enrollment status
- Agent policy assignment
- ES01 connectivity
- Required ports
- Host time settings
- Event ingestion in Kibana

Attack testing began only after confirming that the required agents were healthy and sending data.

### Lesson Learned

Agent health must be verified before, during, and after attack execution. A detection cannot work if the required telemetry is not being collected.

---

## 8. Windows Logging Visibility

### Challenge

Default Windows logging did not provide enough information to observe every emulated technique.

### Impact

Some activity could have occurred without producing sufficiently detailed events for detection or investigation.

### Resolution

The team enabled and configured:

- Advanced Audit Policy
- Logon success and failure auditing
- Kerberos authentication auditing
- PowerShell module logging
- PowerShell script-block logging
- Sysmon monitoring
- Process-creation telemetry

Group Policy was updated and the resulting logs were verified before the final CALDERA operation.

### Lesson Learned

Detection engineering begins with telemetry engineering. Rules cannot detect behaviors that the operating system or endpoint agent does not record.

---

## 9. Time Synchronization

### Challenge

Differences in system time and time-zone configuration made it difficult to compare CALDERA execution times with Elastic events and alerts.

### Impact

Incorrect timestamps could affect:

- Incident-timeline construction
- MTTD calculation
- MTTC and MTTR calculation
- Alert correlation
- Validation of detection results

### Resolution

The team synchronized the date, time, and time-zone configuration across the laboratory systems before the final operation.

### Lesson Learned

Time synchronization is essential in cybersecurity investigations. All systems should use a consistent and documented time reference before evidence is collected.

---

## 10. Delayed Telemetry and Alert Generation

### Challenge

Some endpoint events and Elastic alerts did not appear immediately after an ability was executed.

### Impact

The delay created uncertainty about whether:

- The technique had executed successfully
- The endpoint produced the required event
- Elastic Agent collected the event
- The detection rule matched the activity
- The alert was still being processed

### Resolution

The team separated the validation process into distinct checks:

1. Confirm the CALDERA ability result.
2. Confirm the endpoint event was generated.
3. Confirm the event reached Elasticsearch.
4. Confirm the detection rule was enabled.
5. Confirm the event matched the rule conditions.
6. Allow for ingestion and rule-execution delay.
7. Search for the resulting alert.

### Lesson Learned

Attack execution, telemetry generation, event ingestion, rule evaluation, and alert creation are separate stages. Each stage should be validated independently.

---

## 11. Detection-Rule Development and Tuning

### Challenge

Initial detection rules could be too broad, too restrictive, or dependent on fields that were not consistently available.

### Impact

Poorly tuned rules could produce:

- False positives
- Missed detections
- Duplicate alerts
- Low-confidence results
- Unnecessary analyst workload

### Resolution

The team created rules using telemetry generated by the controlled CALDERA operation and refined them through repeated testing.

Rule tuning considered:

- Process names
- Parent-child relationships
- Command-line arguments
- File paths
- Registry activity
- User and host context
- MITRE ATT&CK mappings
- Legitimate administrative behavior

### Lesson Learned

Detection engineering is an iterative process. Rules should be tested against both malicious simulations and legitimate activity before their performance is evaluated.

---

## 12. Distinguishing Malicious and Legitimate Activity

### Challenge

APT29 frequently uses legitimate Windows tools. Commands involving PowerShell, remote administration, system discovery, and trusted utilities can also be used by administrators.

### Impact

A rule based only on a process name could incorrectly classify legitimate activity as malicious.

### Resolution

The team investigated additional context, including:

- Command-line content
- Parent process
- Executing user
- Target host
- Execution time
- Related events
- CALDERA operation records
- Sequence of activities

### Lesson Learned

Behavioral context is more reliable than a single indicator. Analysts should evaluate combinations of events rather than treating every use of a legitimate tool as malicious.

---

## 13. Measuring Validation Metrics

### Challenge

Detection timestamps were available in Elastic and execution timestamps were available in CALDERA, but containment and remediation times required additional response records.

### Impact

MTTC and MTTR could not be calculated accurately from alerts alone.

### Resolution

The team combined:

- CALDERA execution timestamps
- Elastic event timestamps
- Elastic alert timestamps
- Incident-response records
- Manual containment and remediation times
- Alert-review classifications

Measured values were used when direct timestamps were available. Documented estimates were clearly identified where the response process relied on manual records.

### Lesson Learned

Metric collection should be planned before testing begins. Detection, containment, remediation, and alert-classification timestamps must be recorded during the operation rather than reconstructed later.

---

## 14. Team Coordination

### Challenge

Different team members were responsible for Active Directory, Windows endpoints, Elastic Security, CALDERA, detection rules, and documentation.

A change made to one component could affect the rest of the environment.

### Impact

Uncoordinated changes could result in:

- Incorrect addresses or settings
- Agent disconnections
- Missing logs
- Failed attack abilities
- Inconsistent documentation
- Conflicting test results

### Resolution

The team assigned system responsibilities, shared progress updates, documented important changes, and verified the complete environment before executing the final operation.

### Lesson Learned

A SOC laboratory is an integrated system. Clear ownership is important, but all configuration changes must be communicated to the full team.

---

## Key Lessons Learned

The project produced the following overall lessons:

- Build and validate the network before deploying security platforms.
- Verify application ports instead of relying only on ping tests.
- Treat DNS as a critical dependency for Active Directory.
- Confirm endpoint telemetry before executing attack scenarios.
- Monitor agent health throughout the complete operation.
- Synchronize system time before collecting evidence.
- Test every detection rule against actual generated telemetry.
- Use behavioral context to reduce false positives.
- Record response timestamps while actions are being performed.
- Separate execution, ingestion, detection, and investigation during troubleshooting.
- Document configuration changes and test results consistently.
- Rehearse the complete scenario before collecting final metrics.

---

## Recommendations for Future Work

Future versions of the project could be improved by:

- Automating laboratory health checks
- Creating a pre-operation validation checklist
- Using a centralized and consistent time source
- Expanding endpoint telemetry sources
- Testing additional APT29 techniques
- Increasing the amount of benign baseline activity
- Measuring false positives over a longer period
- Automating selected containment actions
- Creating dashboards for validation metrics
- Repeating operations to compare rule performance
- Adding detection-as-code version control
- Recording exact timestamps for every response action
- Testing the rules against additional Windows versions
- Conducting formal purple-team exercises

---

## Final Reflection

The project demonstrated that successful adversary emulation depends on more than executing attack techniques. Reliable networking, complete telemetry, correct timestamps, healthy agents, accurate detection logic, and coordinated incident-response procedures are all required.

The challenges encountered during the project provided valuable practical experience in troubleshooting an integrated SOC environment. They also showed that detection effectiveness is determined by the complete workflow—from endpoint logging and data collection to alert investigation and response.

---

## Related Documentation

- [Project Overview](project-overview.md)
- [Architecture](architecture.md)
- [APT29 Attack Scenario](attack-scenario.md)
- [Detection and Threat Hunting](detection-and-hunting.md)
- [Incident Response](incident-response.md)
- [Validation Metrics](validation-metrics.md)

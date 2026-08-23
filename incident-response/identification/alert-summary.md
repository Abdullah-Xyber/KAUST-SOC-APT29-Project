# Elastic Alert Summary

The optimized final attack-chain run generated:

- **39 Elastic Security alerts**
- **11/11 selected techniques detected**
- **100% coverage within the selected emulation scope**

The final alert feed contained Critical- and High-severity alerts spanning honeypot access, credential dumping/DCSync, persistence, and PowerShell execution.

During triage, analysts reviewed available fields such as `@timestamp`, rule/severity, `host.name`, `user.name`, process/parent process, command-line activity, and ATT&CK context, then correlated them with CALDERA and Kibana Discover evidence.

![Final Elastic Alerts](../../diagrams/detection-and-hunting/elastic-final-alerts.png)

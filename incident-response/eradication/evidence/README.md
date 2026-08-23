# Eradication Evidence

The project stores shared screenshots under the top-level `diagrams/incident-response/` directory instead of duplicating image files here.

| Evidence | Repository Path | Demonstrates |
|---|---|---|
| WS01 persistence removal | `diagrams/incident-response/eradication-ws01-persistence.png` | Registry Run-key and Scheduled Task removal/verification |
| WMI + Mimikatz removal | `diagrams/incident-response/eradication-wmi-mimikatz.png` | WMI persistence removal on WS02 and Mimikatz removal on DC01 |
| CALDERA agent removal | `diagrams/incident-response/eradication-caldera-agents.png` | Sandcat binary removal verification across affected hosts |

## Evidence Preview

### WS01 Persistence

![WS01 Persistence Eradication](../../../diagrams/incident-response/eradication-ws01-persistence.png)

### WMI and Mimikatz

![WMI and Mimikatz Eradication](../../../diagrams/incident-response/eradication-wmi-mimikatz.png)

### CALDERA Agents

![CALDERA Agent Eradication](../../../diagrams/incident-response/eradication-caldera-agents.png)

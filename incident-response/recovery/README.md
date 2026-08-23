# 🔄 Incident Recovery

## Overview

After containment and eradication were completed, recovery actions were performed to safely return the affected systems and accounts to normal operation.

The recovery phase included resetting the compromised account’s credentials, re-enabling the account, restoring WS01 network connectivity, and confirming that security monitoring remained operational.

The recovery process followed the incident-response lifecycle defined in **NIST SP 800-61 Rev. 2**.

> [!IMPORTANT]
> These procedures were performed in an isolated and authorized laboratory. Passwords, credentials, and other sensitive values have been removed from this public documentation.

---

## Recovery Objectives

The recovery phase aimed to:

- Restore the compromised account securely
- Require a password change at the next logon
- Re-enable the affected account
- Restore WS01 network connectivity
- Confirm that adversary artifacts had been removed
- Confirm that endpoint telemetry was reaching Elastic Security
- Return the laboratory environment to normal operation
- Continue monitoring for signs of recurring malicious activity

---

## Recovery Sequence

Recovery actions were performed in the following order:

1. Confirm that containment and eradication were complete.
2. Reset the compromised account’s password.
3. Require a password change at the next logon.
4. Re-enable the compromised account.
5. Restore WS01 network connectivity.
6. Verify that Elastic Agent resumed sending telemetry.
7. Confirm that Elastic detection rules remained active.
8. Continue monitoring the recovered environment.

---

## 1. Confirm Eradication

Before restoring the system, the team confirmed that the identified adversary artifacts had been removed.

The eradication verification included checking for:

- Registry Run-key persistence
- Unauthorized scheduled tasks
- WMI event-subscription persistence
- Credential-access tools
- CALDERA agent binaries
- Staged collection files

Recovery began only after the affected hosts were confirmed to be free of the identified artifacts.

➡️ [View the eradication evidence](../eradication/)

---

## 2. Reset the Compromised Account

The password of the compromised `ws01` account was reset from the domain controller.

For security, the public repository does not include the password used during the laboratory exercise.

```powershell
$NewPassword = Read-Host "Enter the new password" -AsSecureString

Set-ADAccountPassword `
    -Identity "ws01" `
    -Reset `
    -NewPassword $NewPassword
```

The account was configured to require another password change at the user’s next logon:

```powershell
Set-ADUser `
    -Identity "ws01" `
    -ChangePasswordAtLogon $true
```

> [!WARNING]
> Never publish plaintext passwords, credentials, authentication tokens, or password-reset values in a public repository.

---

## 3. Re-enable the Account

After the password was reset, the compromised account was re-enabled:

```powershell
Enable-ADAccount -Identity "ws01"
```

The account status was checked using:

```powershell
Get-ADUser `
    -Identity "ws01" `
    -Properties Enabled |
    Select-Object Name, Enabled
```

### Expected Result

```text
Name   Enabled
----   -------
ws01   True
```

This confirmed that the account was available again with its updated credentials.

---

## 4. Restore WS01 Network Connectivity

After confirming that the identified artifacts had been removed, the WS01 Ethernet adapter was re-enabled:

```powershell
Enable-NetAdapter `
    -Name "Ethernet" `
    -Confirm:$false
```

The adapter status was checked using:

```powershell
Get-NetAdapter |
    Select-Object Name, Status
```

### Expected Result

```text
Name       Status
----       ------
Ethernet   Up
```

Restoring the network adapter returned WS01 to the internal laboratory network.

---

## Recovery Evidence

The retained recovery evidence shows:

- The WS01 Ethernet adapter restored to an operational state
- The compromised account’s password reset
- The compromised account re-enabled

![WS01 account and network recovery](ws01-recovery.png)

*Figure 1: Recovery verification showing WS01 network connectivity restored and the compromised account reset and re-enabled.*

---

## 5. Verify Elastic Security Visibility

After WS01 was reconnected, Elastic Security was checked to confirm that telemetry collection had resumed.

Example KQL queries:

```kql
event.code: "1" and host.name: "ws01"
```

```kql
event.code: "1" and host.name: "ws02"
```

```kql
event.code: "1" and host.name: "dc01"
```

The verification process checked that:

- Elastic Agent was connected
- Endpoint events were reaching Elasticsearch
- WS01 events were searchable in Kibana
- Detection rules remained enabled
- No new adversary activity appeared after recovery

> [!NOTE]
> Hostname capitalization can differ between Windows and Elastic. Use the exact value stored in the `host.name` field if the query returns no results.

---

## 6. Kerberos Recovery Consideration

The simulated DCSync activity exposed credential material associated with the `krbtgt` account. However, the project did not create or use a Golden Ticket.

The incident-response playbook therefore documented a double `krbtgt` password reset as an additional recovery procedure rather than presenting it as a response to a confirmed forged ticket.

In a real domain compromise, the procedure would normally include:

1. Performing the first `krbtgt` password reset.
2. Allowing sufficient time for replication and existing ticket expiration.
3. Performing the second password reset.
4. Verifying authentication and domain health.

> [!CAUTION]
> A `krbtgt` reset is a high-impact Active Directory operation. It should be planned and performed only by authorized administrators using an organization-approved procedure. It should not be conducted casually in a production environment.

---

## Recovery Verification

| Verification Check | Expected Result | Project Status |
|:---|:---|:---:|
| Identified adversary artifacts | Removed | ✅ Completed |
| Compromised account password | Reset | ✅ Completed |
| Password change at next logon | Required | ✅ Completed |
| Compromised account | Re-enabled | ✅ Completed |
| WS01 network adapter | Up | ✅ Completed |
| WS01 normal connectivity | Restored | ✅ Completed |
| Elastic Agent | Connected and reporting | ✅ Verified during recovery |
| Elastic detection rules | Enabled | ✅ Verified during recovery |
| Double `krbtgt` reset | Documented recovery procedure | 📘 Playbook procedure |

---

## Recovery Result

The recovery actions successfully:

- Restored the compromised account with updated credentials
- Required the user to change the password at the next logon
- Re-enabled the affected domain identity
- Restored WS01 network connectivity
- Returned the affected endpoint to normal operation
- Re-established security-monitoring visibility
- Completed the containment, eradication, and recovery cycle

Following recovery, the environment remained under observation to identify any recurring suspicious activity.

---

## Limitations

The recovery process was performed manually because the laboratory did not include an automated response platform.

The project also had the following limitations:

- Recovery was performed in a small laboratory environment.
- Business-service validation was not required.
- No production users or services were affected.
- The `krbtgt` double-reset procedure was documented for training purposes.
- Long-term post-recovery monitoring was limited to the project period.

In a production environment, recovery should also include:

- System-owner approval
- Business-service testing
- Vulnerability remediation
- Endpoint health validation
- Backup verification
- Increased monitoring
- Formal incident closure
- Communication with relevant stakeholders

---

## Lessons Learned

- Recovery should begin only after containment and eradication are verified.
- Compromised credentials must be reset before an account is re-enabled.
- Password changes should be required at the next legitimate logon.
- Restoring network connectivity before removing persistence could allow the attacker to reconnect.
- Security telemetry must be verified after reconnecting an endpoint.
- High-impact identity actions require careful planning and authorization.
- Recovery evidence should be captured immediately after every action.
- Sensitive credentials must never be published as part of incident documentation.

---

## Related Documentation

- [Incident-Response Overview](../../docs/incident-response.md)
- [Identification Evidence](../identification/)
- [Containment Evidence](../containment/)
- [Eradication Evidence](../eradication/)
- [Lessons Learned](../lessons-learned/)

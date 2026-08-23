# Eradication Procedures

> Run these procedures only in the controlled project lab and on the affected hosts identified during the investigation.

# 1. Remove Registry Run-Key Persistence — WS01

The persistence value was located under:

```text
HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

Remove the `Atomic Red Team` value:

```powershell
Remove-ItemProperty `
  -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" `
  -Name "Atomic Red Team" `
  -Force
```

Verify:

```powershell
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
```

The `Atomic Red Team` value should no longer be present.

---

# 2. Remove Scheduled Task — WS01

Remove the scheduled task named `spawn`:

```powershell
Unregister-ScheduledTask -TaskName "spawn" -Confirm:$false
```

Verify:

```powershell
Get-ScheduledTask -TaskName "spawn" -ErrorAction SilentlyContinue
```

No matching task should be returned.

![WS01 Persistence Eradication](../../diagrams/incident-response/eradication-ws01-persistence.png)

---

# 3. Remove WMI Event Subscription — WS02

The WMI persistence mechanism consisted of:

- `__FilterToConsumerBinding`
- `CommandLineEventConsumer`
- `__EventFilter`

The components were removed in the documented order:

```text
Binding → Consumer → Filter
```

Remove the binding:

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName __FilterToConsumerBinding |
Where-Object {
    $_.Filter.Name -like "*AtomicRedTeam*"
} |
Remove-CimInstance
```

Remove the consumer:

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName CommandLineEventConsumer |
Where-Object {
    $_.Name -like "*AtomicRedTeam*"
} |
Remove-CimInstance
```

Remove the filter:

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName __EventFilter |
Where-Object {
    $_.Name -like "*AtomicRedTeam*"
} |
Remove-CimInstance
```

Verify:

```powershell
Get-CimInstance `
  -Namespace root/subscription `
  -ClassName __EventFilter
```

The adversary-created WMI subscription should no longer be present.

---

# 4. Remove Mimikatz — DC01

Remove the Mimikatz directory:

```powershell
Remove-Item -Path "$env:TEMP\mimikatz" -Recurse -Force
```

Verify:

```powershell
Test-Path "$env:TEMP\mimikatz"
```

Expected result:

```text
False
```

![WMI and Mimikatz Eradication](../../diagrams/incident-response/eradication-wmi-mimikatz.png)

---

# 5. Remove CALDERA Sandcat Binary

The CALDERA Sandcat agent was staged as:

```text
C:\Users\Public\splunkd.exe
```

Remove the binary:

```powershell
Remove-Item "C:\Users\Public\splunkd.exe" `
  -Force `
  -ErrorAction SilentlyContinue
```

Verify:

```powershell
Test-Path "C:\Users\Public\splunkd.exe"
```

Expected result:

```text
False
```

The verification was performed on:

- `WS01`
- `WS02`
- `DC01`

![CALDERA Agent Eradication](../../diagrams/incident-response/eradication-caldera-agents.png)

---

# 6. Remove Collection Staging Files — WS01

Remove the files generated during the Collection phase:

```powershell
Remove-Item "$env:TEMP\T1119_*.txt" `
  -Force `
  -ErrorAction SilentlyContinue
```

Verify:

```powershell
Get-ChildItem "$env:TEMP" -Filter "T1119_*"
```

No matching files should be returned.

---

# Completion

Eradication is considered complete only after the verification checks confirm that the identified artifacts are no longer present.

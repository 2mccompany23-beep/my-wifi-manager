# ==============================================================================
# Script MikroTik RouterOS v7 : AlwaysData Polling Agent (Option 2 - CGNAT)
# ==============================================================================
:local serverUrl "https://2mc.alwaysdata.net/api/poll?token=mcwifi_secret_token_2026"
:local resultUrl "https://2mc.alwaysdata.net/api/poll/result?token=mcwifi_secret_token_2026"
:local authToken "mcwifi_secret_token_2026"

:do {
  # 1. Interrogation du serveur AlwaysData (HTTP GET)
  :local fetchRes [/tool fetch url=$serverUrl http-header-field="Authorization: Bearer $authToken" as-value output=user]
  
  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
    :local rawData ($fetchRes->"data")
    
    # 2. Désérialisation du JSON (RouterOS v7)
    :local parsedData [:deserialize from=json value=$rawData]
    :local action ($parsedData->"action")
    
    :if ($action = "run") do={
      :local commandId ($parsedData->"id")
      :local cmdText ($parsedData->"command")
      
      # 3. Exécution ultra-rapide par parsing direct (sans script temporaire)
      :local cmdFunc [:parse $cmdText]
      :local outputData [$cmdFunc]
      
      # 4. Construction et envoi du résultat en JSON au serveur AlwaysData (HTTP POST)
      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }
      :local resJson [:serialize to=json value=$resObj]
      
      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Authorization: Bearer $authToken\r\nContent-Type: application/json" as-value output=user
    }
  }
} on-error={
  # Gestion silencieuse des coupures réseau temporaires
}
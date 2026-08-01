# ==============================================================================
# Script MikroTik RouterOS v7 : AlwaysData Polling Agent (Option 2 - CGNAT)
# ==============================================================================
:local serverUrl "https://2mc.alwaysdata.net/api/poll"
:local resultUrl "https://2mc.alwaysdata.net/api/poll/result"
:local authToken "mcwifi_secret_token_2026"

:do {
  # 1. Interrogation du serveur AlwaysData (HTTP GET avec jeton Bearer)
  :local fetchRes [/tool fetch url=$serverUrl http-header-field="Authorization: Bearer $authToken" as-value output=user]
  
  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
    :local rawData ($fetchRes->"data")
    
    # 2. Désérialisation du JSON (RouterOS v7)
    :local parsedData [:deserialize from=json value=$rawData]
    :local action ($parsedData->"action")
    
    :if ($action = "run") do={
      :local commandId ($parsedData->"id")
      :local cmdText ($parsedData->"command")
      
      # 3. Exécution directe du code RouterOS via :parse
      :local cmdFunc [:parse $cmdText]
      :local outputData [$cmdFunc]
      
      # 4. Envoi du résultat en JSON au serveur AlwaysData (HTTP POST)
      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }
      :local resJson [:serialize to=json value=$resObj]
      
      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Authorization: Bearer $authToken" http-header-field="Content-Type: application/json" as-value output=user
    }
  }
} on-error={
  # Gestion silencieuse des coupures réseau temporaires
}
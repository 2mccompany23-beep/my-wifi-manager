# ==============================================================================
# Script MikroTik RouterOS v7 : AlwaysData Polling Agent Ultra-Fast
# ==============================================================================
:local serverUrl "https://2mc.alwaysdata.net/api/poll?token=mcwifi_secret_token_2026"
:local resultUrl "https://2mc.alwaysdata.net/api/poll/result?token=mcwifi_secret_token_2026"
:local authToken "mcwifi_secret_token_2026"

:do {
  :local keepLoop true
  :local maxBatch 10
  :local count 0

  :while ($keepLoop && $count < $maxBatch) do={
    :set count ($count + 1)
    :local fetchRes [/tool fetch url=$serverUrl http-header-field="Authorization: Bearer $authToken" as-value output=user]
    
    :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
      :local rawData ($fetchRes->"data")
      :local parsedData [:deserialize from=json value=$rawData]
      :local action ($parsedData->"action")
      
      :if ($action = "run") do={
        :local commandId ($parsedData->"id")
        :local cmdText ($parsedData->"command")
        
        :local cmdFunc [:parse $cmdText]
        :local outputData [$cmdFunc]
        :local outStr [:tostr $outputData]
        
        :local resObj { "id"=$commandId; "status"="done"; "output"=$outStr }
        :local resJson [:serialize to=json value=$resObj]
        
        /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Authorization: Bearer $authToken\r\nContent-Type: application/json" as-value output=user
      } else={
        :set keepLoop false
      }
    } else={
      :set keepLoop false
    }
  }
} on-error={
  # Gestion silencieuse des coupures réseau temporaires
}
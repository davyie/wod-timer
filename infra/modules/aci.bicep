param location string
param imageTag string
param acrLoginServer string
param acrUsername string
@secure()
param acrPassword string
param cosmosEndpoint string
@secure()
param cosmosKey string

resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: 'timer-app'
  location: location
  properties: {
    osType: 'Linux'
    restartPolicy: 'Always'
    imageRegistryCredentials: [
      {
        server: acrLoginServer
        username: acrUsername
        password: acrPassword
      }
    ]
    containers: [
      {
        name: 'frontend'
        properties: {
          image: '${acrLoginServer}/timer-frontend:${imageTag}'
          ports: [{ port: 80, protocol: 'TCP' }]
          resources: {
            requests: { cpu: json('0.5'), memoryInGB: json('0.5') }
          }
        }
      }
      {
        name: 'backend'
        properties: {
          image: '${acrLoginServer}/timer-backend:${imageTag}'
          ports: [{ port: 8080, protocol: 'TCP' }]
          resources: {
            requests: { cpu: json('1.0'), memoryInGB: json('1.0') }
          }
          environmentVariables: [
            { name: 'COSMOS_ENDPOINT', value: cosmosEndpoint }
            { name: 'COSMOS_KEY', secureValue: cosmosKey }
            { name: 'COSMOS_DATABASE', value: 'timer-db' }
          ]
        }
      }
    ]
    ipAddress: {
      type: 'Public'
      ports: [{ port: 80, protocol: 'TCP' }]
      dnsNameLabel: 'timer-app-${uniqueString(resourceGroup().id)}'
    }
  }
}

output fqdn string = containerGroup.properties.ipAddress.fqdn
output ip string = containerGroup.properties.ipAddress.ip

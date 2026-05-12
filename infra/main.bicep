param location string = resourceGroup().location
param imageTag string = 'latest'

@secure()
param cosmosKey string

@secure()
param acrPassword string

param acrUsername string
param acrLoginServer string

module cosmos 'modules/cosmos.bicep' = {
  name: 'cosmos'
  params: { location: location }
}

module aci 'modules/aci.bicep' = {
  name: 'aci'
  params: {
    location: location
    imageTag: imageTag
    acrLoginServer: acrLoginServer
    acrUsername: acrUsername
    acrPassword: acrPassword
    cosmosEndpoint: cosmos.outputs.endpoint
    cosmosKey: cosmosKey
  }
}

output appUrl string = 'http://${aci.outputs.fqdn}'
output appIp string = aci.outputs.ip

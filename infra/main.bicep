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

module containerAppEnv 'modules/container-app-env.bicep' = {
  name: 'containerAppEnv'
  params: { location: location }
}

module containerApps 'modules/container-apps.bicep' = {
  name: 'containerApps'
  params: {
    location: location
    imageTag: imageTag
    acrLoginServer: acrLoginServer
    acrUsername: acrUsername
    acrPassword: acrPassword
    cosmosEndpoint: cosmos.outputs.endpoint
    cosmosKey: cosmosKey
    envId: containerAppEnv.outputs.envId
  }
}

output appUrl string = containerApps.outputs.frontendUrl

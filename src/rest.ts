import { URLExt } from '@jupyterlab/coreutils'

import { ServerConnection } from '@jupyterlab/services'

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings()
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'jlab_aiidatree', // API Namespace
    endPoint
  )

  let response: Response
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings)
  } catch (error) {
    throw new ServerConnection.NetworkError(error)
  }

  let data: any = await response.text()

  if (data.length > 0) {
    try {
      data = JSON.parse(data)
    } catch (error) {
      console.log('Not a JSON response body.', response)
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data)
  }

  return data
}

export async function queryNode(pk: number, url: string | null = null) {
  // return all data for a single node
  const dataToSend = {
    path: [{ entity_type: '', tag: 'node' }],
    filters: { node: { id: { '==': pk } } },
    project: { node: ['**'] },
    url
  }
  let reply: { data: { node: { [key: string]: any }[] } }
  try {
    reply = await requestAPI<any>('querybuilder', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
  } catch (reason) {
    console.warn(
      `Error on POST /jlab_aiidatree/querybuilder ${dataToSend}.\n${reason}`
    )
    // TODO deal with errors
  }
  if (reply.data.node.length === 0) {
    return {} // TODO return null and handle it
  }
  return reply.data.node[0]
}

export interface IProcess {
  id: number
  // label: string | null
  // description: string | null
  // mtime: string
  // nodeType: string
  // processType: string
  processLabel: string
  processState?:
    | 'created'
    | 'running'
    | 'waiting'
    | 'finished'
    | 'excepted'
    | 'killed'
  // processStatus?: string
  // exitStatus?: number
  // schedulerState?: string
  // paused?: boolean
  // icon?:
  //   | 'statusSucceeded'
  //   | 'statusKilled'
  //   | 'statusFailed'
  //   | 'statusCreated'
  //   | 'statusPaused'
  //   | 'statusUnknown'
  //   | 'statusWaiting'
  //   | 'statusRunning'
  //   | 'statusExcepted'
}

export async function queryProcesses(
  limit = 9999,
  orderBy = 'id',
  url: string | null = null
): Promise<IProcess[]> {
  // return a list of all processes

  // TODO filter by process state

  // const fields = ["id", "label", "description", "mtime", "node_type", "process_type", "attributes.process_label", "attributes.process_state", "attributes.process_status", "attributes.exit_status"]
  const fields = {
    id: 'id',
    processLabel: 'attributes.process_label',
    processState: 'attributes.process_state'
  }
  const dataToSend = {
    path: [{ entity_type: 'process.ProcessNode.', tag: 'node' }],
    project: { node: Object.values(fields) },
    limit,
    order_by: { node: { [orderBy]: 'asc' } },
    url
  }
  let reply: { data: { node?: { [key: string]: any }[] } }
  try {
    reply = await requestAPI<any>('querybuilder', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
  } catch (reason) {
    console.warn(
      `Error on POST /jlab_aiidatree/querybuilder ${dataToSend}.\n${reason}`
    )
    // TODO deal with errors
    // (we don't want to crash the program, just because the database is not available)
    return []
  }
  if (reply.data.node === undefined) {
    return []
  }
  return reply['data']['node'].map(row => {
    return {
      id: row['id'],
      processLabel: row['attributes.process_label'],
      processState: row['attributes.process_state']
    } as unknown as IProcess
  })
}

export interface INodeLink {
  linkDirection: 'incoming' | 'outgoing'
  linkLabel: string
  linkType: string
  nodeId: number
  nodeLabel: string
  nodeDescription: string
  nodeType: string
}

export async function queryOutgoing(
  pk: number,
  url: string | null = null
): Promise<INodeLink[]> {
  // Query all outgoing nodes for a certain node
  const dataToSend = {
    path: [
      { entity_type: '', tag: 'root' },
      { entity_type: '', tag: 'node', edge_tag: 'edge', with_incoming: 'root' }
    ],
    filters: {
      root: { id: pk }
    },
    project: {
      node: ['id', 'label', 'description', 'node_type'],
      edge: ['label', 'type']
    },
    url
  }
  let reply: { data: { node?: any[]; edge?: any[] } }
  try {
    reply = await requestAPI<any>('querybuilder', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
  } catch (reason) {
    console.warn(
      `Error on POST /jlab_aiidatree/querybuilder ${dataToSend}.\n${reason}`
    )
    // TODO deal with errors
    return []
  }
  if (reply.data.node === undefined) {
    return []
  }
  return reply.data.node.map((row, index) => {
    return {
      linkDirection: 'outgoing',
      linkLabel: reply.data['edge'][index]['label'],
      linkType: reply.data['edge'][index]['type'],
      nodeId: row['id'],
      nodeLabel: row['label'],
      nodeDescription: row['description'],
      nodeType: row['node_type']
    } as unknown as INodeLink
  })
}

export async function queryIncoming(
  pk: number,
  url: string | null = null
): Promise<INodeLink[]> {
  // Query all outgoing nodes for a certain node
  const dataToSend = {
    path: [
      { entity_type: '', tag: 'root' },
      { entity_type: '', tag: 'node', edge_tag: 'edge', with_outgoing: 'root' }
    ],
    filters: {
      root: { id: pk }
    },
    project: {
      node: ['id', 'label', 'description', 'node_type'],
      edge: ['label', 'type']
    },
    url
  }
  let reply: { data: { node?: any[]; edge?: any[] } }
  try {
    reply = await requestAPI<any>('querybuilder', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    })
  } catch (reason) {
    console.warn(
      `Error on POST /jlab_aiidatree/querybuilder ${dataToSend}.\n${reason}`
    )
    // TODO deal with errors
    return []
  }
  if (reply.data.node === undefined) {
    return []
  }
  return reply.data.node.map((row, index) => {
    return {
      linkDirection: 'incoming',
      linkLabel: reply.data['edge'][index]['label'],
      linkType: reply.data['edge'][index]['type'],
      nodeId: row['id'],
      nodeLabel: row['label'],
      nodeDescription: row['description'],
      nodeType: row['node_type']
    } as unknown as INodeLink
  })
}

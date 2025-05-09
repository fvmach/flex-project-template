import * as Flex from '@twilio/flex-ui';
import { SyncClient, SyncMap, SyncMapItem } from 'twilio-sync';
import { Paginator } from 'twilio-sync/lib/paginator';

import logger from '../../logger';

export type SyncStreamEvent = {
  message: any; // twilio-sync does not export the StreamMessage type
  isLocal: boolean;
};

const manager = Flex.Manager.getInstance();

const client = new SyncClient(manager.user.token, {
  region: (manager.configuration.sdkOptions?.flex as any)?.environmentConfig?.region,
});

export default client;

export const getAllSyncMapItems = async (syncMap: SyncMap) => {
  return syncMap.getItems().then(_pageHandler);
};

async function _pageHandler(paginator: Paginator<SyncMapItem>): Promise<SyncMapItem[]> {
  if (paginator.hasNextPage) {
    return paginator.items.concat(await paginator.nextPage().then(_pageHandler));
  }
  return Promise.resolve(paginator.items);
}

export const subscribe = async (
  uniqueName: string,
  publishCallback: (event: SyncStreamEvent) => void,
): Promise<any> => {
  try {
    const stream = await client.stream(uniqueName);
    stream.on('messagePublished', (event: SyncStreamEvent) => {
      if (!publishCallback) return;
      publishCallback(event);
    });
    return stream;
  } catch (error: any) {
    logger.error('[SyncClient] Unable to subscribe to Sync stream', error);
    return null;
  }
};

export const publishMessage = async (stream: any, message: any) => {
  try {
    await stream?.publishMessage(message);
  } catch (error: any) {
    logger.error('[SyncClient] Unable to publish message to Sync stream', error);
  }
};

export const unsubscribe = async (stream: any) => {
  try {
    stream?.close();
  } catch (error: any) {
    logger.error('[SyncClient] Unable to unsubscribe from Sync stream', error);
  }
};

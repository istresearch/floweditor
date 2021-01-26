import Pill from 'components/pill/Pill';
import { SendMsg } from 'flowTypes';
import * as React from 'react';

import styles from './SendMsg.module.scss';
import i18n from 'config/i18n';
import { renderAssetList } from '../helpers';
import { AssetType } from '../../../../store/flowContext';
import { MAX_TO_SHOW } from '../addlabels/AddLabels';

export const PLACEHOLDER = i18n.t('actions.send_msg.placeholder', 'Send a message to the contact');

const SendMsgComp: React.SFC<SendMsg> = (action: SendMsg): JSX.Element => {
  if (action.text) {
    let replies = null;

    let quickReplies = action.quick_replies || [];
    if (quickReplies.length > 0) {
      replies = (
        <div className={styles.quick_replies}>
          {quickReplies.map(reply => (
            <Pill
              style={{ marginLeft: 4, marginTop: 4 }}
              maxLength={20}
              advanced={true}
              key={action.uuid + reply}
              text={reply}
            />
          ))}
        </div>
      );
    }

    return (
      <>
        <div>
          {action.text.split(/\r?\n/).map((line: string, idx: number) => (
            <div key={action.uuid + idx} className={styles.line}>
              {line}
            </div>
          ))}

          {action.labels
            ? renderAssetList(
                action.labels.map(label => {
                  return {
                    id: label.uuid,
                    name: label.name,
                    type: AssetType.Label
                  };
                }),
                MAX_TO_SHOW,
                null
              )
            : null}

          {action.attachments && action.attachments.length > 0 ? (
            <div className={`${styles.attachment} fe-paperclip`} />
          ) : null}
          {action.templating && action.templating.template ? (
            <div className={`${styles.whatsapp} fe-whatsapp`} />
          ) : null}
          {action.topic ? <div className={`${styles.facebook} fe-facebook`} /> : null}
        </div>
        <div className={styles.summary}>{replies}</div>
      </>
    );
  }
  return <div className="placeholder">{PLACEHOLDER}</div>;
};

export default SendMsgComp;

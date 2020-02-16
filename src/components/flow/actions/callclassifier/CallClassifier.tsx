import * as React from 'react';
import { CallClassifier, WithIssues } from 'flowTypes';
import { renderAsset } from '../helpers';
import { AssetType } from 'store/flowContext';
import { fakePropType } from 'config/ConfigProvider';

const CallClassifierComp: React.SFC<CallClassifier & WithIssues> = (
  { classifier, issues },
  context: any
): JSX.Element => {
  return renderAsset(
    {
      id: classifier.uuid,
      name: classifier.name,
      type: AssetType.Classifier,
      missing: issues.length > 0
    },
    context.config.endpoints
  );
};

CallClassifierComp.contextTypes = {
  config: fakePropType
};

export default CallClassifierComp;

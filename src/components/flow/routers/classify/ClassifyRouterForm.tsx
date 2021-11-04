import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet, Tab } from 'components/dialog/Dialog';
import { hasErrors, renderIssues } from 'components/flow/actions/helpers';
import { RouterFormProps } from 'components/flow/props';
import { nodeToState, stateToNode } from './helpers';
import { createResultNameInput } from 'components/flow/routers/widgets';
import TypeList from 'components/nodeeditor/TypeList';
import * as React from 'react';
import { FormState, mergeForm, StringEntry, FormEntry } from 'store/nodeEditor';
import {
  Alphanumeric,
  Required,
  shouldRequireIf,
  StartIsNonNumeric,
  validate
} from 'store/validators';
import CaseList, { CaseProps } from 'components/flow/routers/caselist/CaseList';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import { Asset } from 'store/flowContext';
import { renderIf } from 'utils';
import { intentOperatorList } from 'config/operatorConfigs';
import TextInputElement from 'components/form/textinput/TextInputElement';
import { DEFAULT_OPERAND } from 'components/nodeeditor/constants';
import { fetchAsset } from 'external';
import styles from './ClassifyRouterForm.module.scss';
import i18n from 'config/i18n';

export interface ClassifyRouterFormState extends FormState {
  hiddenCases: CaseProps[];
  resultName: StringEntry;
  classifier: FormEntry;
  cases: CaseProps[];
  operand: StringEntry;
}

export default class ClassifyRouterForm extends React.Component<
  RouterFormProps,
  ClassifyRouterFormState
> {
  constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^handle/]
    });

    // we need to resolve our classifier for intent selection
    if (this.state.classifier.value) {
      // TODO: don't use asset as intermediary now that AssetSelector deals in native options
      fetchAsset(this.props.assetStore.classifiers, this.state.classifier.value.uuid).then(
        (classifier: Asset) => {
          if (classifier) {
            this.handleUpdate({
              classifier: { ...this.state.classifier.value, ...classifier.content }
            });
          }
        }
      );
    }
  }

  private handleUpdate(
    keys: {
      resultName?: string;
      classifier?: any;
    },
    submitting = false
  ): boolean {
    const updates: Partial<ClassifyRouterFormState> = {};

    if (keys.hasOwnProperty('resultName')) {
      updates.resultName = validate(i18n.t('forms.result_name', 'Result Name'), keys.resultName, [
        shouldRequireIf(submitting)
      ]);
    }

    if (keys.hasOwnProperty('classifier')) {
      updates.classifier = validate(i18n.t('forms.classifier', 'Classifier'), keys.classifier, [
        shouldRequireIf(submitting)
      ]);
    }

    const updated = mergeForm(this.state, updates);

    // update our form
    this.setState(updated);
    return updated.valid;
  }

  private handleCasesUpdated(cases: CaseProps[]): void {
    const invalidCase = cases.find((caseProps: CaseProps) => !caseProps.valid);
    this.setState({ cases, valid: !invalidCase });
  }

  private handleUpdateResultName(value: string): void {
    const resultName = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      Required,
      Alphanumeric,
      StartIsNonNumeric
    ]);
    this.setState({
      resultName,
      valid: this.state.valid && !hasErrors(resultName)
    });
  }

  private handleSave(): void {
    // if we still have invalid cases, don't move forward
    const invalidCase = this.state.cases.find((caseProps: CaseProps) => !caseProps.valid);
    if (invalidCase) {
      return;
    }

    // validate our result name in case they haven't interacted
    const valid = this.handleUpdate(
      {
        resultName: this.state.resultName.value,
        classifier: this.state.classifier.value
      },
      true
    );

    if (valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  }

  private handleClassifierUpdated(selected: Asset[]): void {
    this.handleUpdate({ classifier: selected[0] });
  }

  private handleOperandUpdated(value: string): void {
    this.setState({
      operand: validate(i18n.t('forms.operand', 'Operand'), value, [Required])
    });
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: i18n.t('buttons.ok', 'Ok'), onClick: this.handleSave },
      secondary: {
        name: i18n.t('buttons.cancel', 'Cancel'),
        onClick: () => this.props.onClose(true)
      }
    };
  }

  private dialog: Dialog;

  private renderEdit(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    const tabs: Tab[] = [
      {
        name: 'Classifier Input',
        checked: this.state.operand.value !== DEFAULT_OPERAND,
        body: (
          <>
            <p>
              Enter an expression to use as the input to your classifier. To classify the last
              response from the contact use <code>{DEFAULT_OPERAND}</code>.
            </p>
            <TextInputElement
              name={i18n.t('forms.operand', 'Operand')}
              showLabel={false}
              autocomplete={true}
              onChange={this.handleOperandUpdated}
              entry={this.state.operand}
            />
          </>
        )
      }
    ];

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={tabs}
        ref={ele => {
          this.dialog = ele;
        }}
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <p>
          <span>Run </span>
          <span
            className={styles.link}
            onClick={() => {
              this.dialog.showTab(0);
            }}
          >
            {this.state.operand.value === DEFAULT_OPERAND
              ? 'the last response'
              : this.state.operand.value}
          </span>
          <span> through the classifier...</span>
        </p>
        <AssetSelector
          key="select_classifier"
          name={i18n.t('forms.classifier', 'Classifier')}
          placeholder="Select the classifier to use"
          assets={this.props.assetStore.classifiers}
          onChange={this.handleClassifierUpdated}
          entry={this.state.classifier}
        />

        {renderIf(!!this.state.classifier.value)(
          <CaseList
            data-spec="cases"
            cases={this.state.cases}
            onCasesUpdated={this.handleCasesUpdated}
            operators={intentOperatorList}
            classifier={this.state.classifier.value}
          />
        )}

        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
        {renderIssues(this.props)}
      </Dialog>
    );
  }

  public render(): JSX.Element {
    return this.renderEdit();
  }
}

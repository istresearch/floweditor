import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { initializeForm, stateToAction } from 'components/flow/actions/sendbroadcast/helpers';
import { ActionFormProps } from 'components/flow/props';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import TextInputElement, { Count } from 'components/form/textinput/TextInputElement';
import TypeList from 'components/nodeeditor/TypeList';
import { fakePropType } from 'config/ConfigProvider';
import * as React from 'react';
import { Asset } from 'store/flowContext';
import { AssetArrayEntry, FormState, mergeForm, StringEntry } from 'store/nodeEditor';
import { shouldRequireIf, validate } from 'store/validators';
import i18n from 'config/i18n';
import { renderIssues } from '../helpers';

export interface SendBroadcastFormState extends FormState {
  message: StringEntry;
  recipients: AssetArrayEntry;
}

// Note: action prop is only used for its uuid (see onValid)
export default class SendBroadcastForm extends React.Component<
  ActionFormProps,
  SendBroadcastFormState
> {
  public static contextTypes = {
    endpoints: fakePropType,
    assetService: fakePropType
  };

  constructor(props: ActionFormProps) {
    super(props);
    this.state = initializeForm(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  public handleRecipientsChanged(recipients: Asset[]): boolean {
    return this.handleUpdate({ recipients });
  }

  public handleMessageUpdate(text: string): boolean {
    return this.handleUpdate({ text });
  }

  private handleUpdate(keys: { text?: string; recipients?: Asset[] }, submitting = false): boolean {
    const updates: Partial<SendBroadcastFormState> = {};

    if (keys.hasOwnProperty('recipients')) {
      updates.recipients = validate(i18n.t('forms.recipients', 'Recipients'), keys.recipients!, [
        shouldRequireIf(submitting)
      ]);
    }

    if (keys.hasOwnProperty('text')) {
      updates.message = validate(i18n.t('forms.message', 'Message'), keys.text!, [
        shouldRequireIf(submitting)
      ]);
    }

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  private handleSave(): void {
    // validate in case they never updated an empty field
    const valid = this.handleUpdate(
      {
        text: this.state.message.value,
        recipients: this.state.recipients.value!
      },
      true
    );

    if (valid) {
      this.props.updateAction(stateToAction(this.props.nodeSettings, this.state));

      // notify our modal we are done
      this.props.onClose(false);
    }
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

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;
    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <AssetSelector
          name={i18n.t('forms.recipients', 'Recipients')}
          placeholder={i18n.t('forms.select_contacts', 'Select Contacts')}
          assets={this.props.assetStore.recipients}
          entry={this.state.recipients}
          searchable={true}
          multi={true}
          expressions={true}
          onChange={this.handleRecipientsChanged}
        />
        <p />
        <TextInputElement
          name={i18n.t('forms.message', 'Message')}
          showLabel={false}
          count={Count.SMS}
          onChange={this.handleMessageUpdate}
          entry={this.state.message}
          autocomplete={true}
          focus={true}
          textarea={true}
        />
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}

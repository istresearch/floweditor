import { default as bindCallbacks } from 'auto-bind/react';
import * as React from 'react';

// tslint:disable-next-line: no-empty-interface
interface FixyProps {}

interface FixyState {
  top: number;
  fixed: boolean;
}

export class Fixy extends React.PureComponent<FixyProps, FixyState> {
  private ele!: HTMLDivElement | null;

  constructor(props: FixyProps) {
    super(props);
    this.state = {
      top: 0,
      fixed: false
    };

    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  private handleScroll(): void {
    const fixed = window.scrollY > this.state.top;
    this.setState({ fixed });
  }

  public componentWillUnmount(): void {
    window.removeEventListener('scroll', this.handleScroll);
  }

  public componentDidMount(): void {
    const top = this.ele!.getBoundingClientRect().top + window.scrollY;
    const fixed = window.scrollY > top;
    this.setState({ top, fixed });
    window.addEventListener('scroll', this.handleScroll);
  }

  public render(): JSX.Element {
    let styles: React.CSSProperties = { position: 'absolute' };
    if (this.state.fixed) {
      styles = {
        position: 'fixed',
        top: 0
      };
    }

    return (
      <div
        ref={ele => {
          this.ele = ele;
        }}
        style={styles}
      >
        {this.props.children}
      </div>
    );
  }
}

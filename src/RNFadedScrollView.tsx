import React, { Component, forwardRef, PropsWithChildren, Ref } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';
import LinearGradient from 'react-native-linear-gradient';

const defaultFadeColors = [
  'rgba(229, 229, 229, 0.18)',
  'rgba(206, 201, 201, 0.6)',
  'rgba(206, 201, 201, 0.9)',
];

export type Props = ScrollViewProps &
  Partial<typeof RNFadedScrollView.defaultProps> &
  PropsWithoutDefault;

type PropsWithoutDefault = {
  isCloseToEnd?: (...args: any) => any;
  isCloseToStart?: (...args: any) => any;
  innerRef?: Ref<ScrollView>;
  startFadeStyle?: StyleProp<ViewStyle>;
  endFadeStyle?: StyleProp<ViewStyle>;
  dividerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

interface State {
  scrollHeight: number;
  scrollWidth: number;
  availableWidth: number;
  availableHeight: number;
  allowStartFade: boolean;
  allowEndFade: boolean;
}

class RNFadedScrollView extends Component<PropsWithChildren<Props>, State> {
  static propTypes = {
    allowStartFade: PropTypes.bool,
    allowEndFade: PropTypes.bool,
    fadeSize: PropTypes.number,
    fadeColors: PropTypes.array,
    isCloseToEnd: PropTypes.func,
    isCloseToStart: PropTypes.func,
    scrollThreshold: PropTypes.number,
    allowDivider: PropTypes.bool,
    isRtl: PropTypes.bool,
  };

  static defaultProps = {
    allowStartFade: false,
    allowEndFade: true,
    fadeSize: 20,
    fadeColors: defaultFadeColors,
    scrollThreshold: 10,
    allowDivider: false,
    isRtl: false,
  };

  readonly props!: Readonly<
    PropsWithChildren<
      ScrollViewProps &
        typeof RNFadedScrollView.defaultProps &
        PropsWithoutDefault
    >
  >;

  constructor(props: PropsWithChildren<Props>) {
    super(props);
    this.state = {
      // We don't know the size of the content initially, and the probably won't instantly try to scroll,
      // so set the initial content height and width to 0
      scrollHeight: 0,
      scrollWidth: 0,
      availableWidth: 0,
      availableHeight: 0,
      allowStartFade: false,
      allowEndFade: true,
    };
  }

  onContentSizeChange = (contentWidth: number, contentHeight: number) => {
    // Save the content height in state
    this.setState({ scrollHeight: contentHeight, scrollWidth: contentWidth });

    const { onContentSizeChange } = this.props;
    if (onContentSizeChange) onContentSizeChange(contentWidth, contentHeight);
  };

  _onLayout(event: LayoutChangeEvent) {
    const containerWidth = event.nativeEvent.layout.width;
    const containerHeight = event.nativeEvent.layout.height;

    this.setState({
      availableWidth: containerWidth,
      availableHeight: containerHeight,
    });
  }

  isEndFadeAllowed() {
    const sizeToCompare = this.props.horizontal
      ? this.state.scrollWidth
      : this.state.scrollHeight;
    const availableSpace = this.props.horizontal
      ? this.state.availableWidth
      : this.state.availableHeight;
    return this.props.allowEndFade ? sizeToCompare > availableSpace : false;
  }

  ifCloseToStart({ contentOffset }: NativeScrollEvent) {
    return this.props.horizontal
      ? contentOffset.x < this.props.scrollThreshold
      : contentOffset.y < this.props.scrollThreshold;
  }
  isCloseToBottom({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: NativeScrollEvent) {
    return this.props.horizontal
      ? layoutMeasurement.width + contentOffset.x >=
          contentSize.width - this.props.scrollThreshold
      : layoutMeasurement.height + contentOffset.y >=
          contentSize.height - this.props.scrollThreshold;
  }

  //To avoid ScrollView RTL issue on andorid.
  allowReverse() {
    return Platform.OS === 'android' && this.props.isRtl;
  }
  onScrolled = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (this.props.isCloseToEnd) {
      this.props.isCloseToEnd(this.isCloseToBottom(e.nativeEvent));
    }
    if (this.props.isCloseToStart) {
      this.props.isCloseToStart(this.ifCloseToStart(e.nativeEvent));
    }
    if (this.props.allowStartFade) {
      if (!this.allowReverse()) {
        this.setState({
          allowStartFade: this.ifCloseToStart(e.nativeEvent) ? false : true,
        });
      } else {
        this.setState({
          allowEndFade: this.ifCloseToStart(e.nativeEvent) ? false : true,
        });
      }
    }
    if (this.props.allowEndFade) {
      if (!this.allowReverse()) {
        this.setState({
          allowEndFade: this.isCloseToBottom(e.nativeEvent) ? false : true,
        });
      } else {
        this.setState({
          allowStartFade: this.isCloseToBottom(e.nativeEvent) ? false : true,
        });
      }
    }
    if (this.props.onScroll) {
      this.props.onScroll(e);
    }
  };

  //get start fade view
  getStartFade() {
    return this.props.horizontal ? (
      <LinearGradient
        start={{ x: this.props.isRtl ? 0 : 1, y: 0 }}
        end={{ x: this.props.isRtl ? 1 : 0, y: 0 }}
        style={[
          styles.startFadeHorizontal,
          {
            width: this.props.fadeSize,
          },
          this.props.startFadeStyle,
        ]}
        colors={this.props.fadeColors}
        pointerEvents={'none'}
      />
    ) : (
      <LinearGradient
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={[
          styles.startFadeVertical,
          {
            height: this.props.fadeSize,
          },
          this.props.startFadeStyle,
        ]}
        colors={this.props.fadeColors}
        pointerEvents={'none'}
      />
    );
  }

  getEndFade() {
    return this.props.horizontal ? (
      <LinearGradient
        start={{ x: this.props.isRtl ? 1 : 0, y: 0 }}
        end={{ x: this.props.isRtl ? 0 : 1, y: 0 }}
        style={[
          styles.endFadeHorizontal,
          {
            width: this.props.fadeSize,
          },
          this.props.endFadeStyle,
        ]}
        colors={this.props.fadeColors}
        pointerEvents={'none'}
      />
    ) : (
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.endFadeVertical,
          {
            height: this.props.fadeSize,
          },
          this.props.endFadeStyle,
        ]}
        colors={this.props.fadeColors}
        pointerEvents={'none'}
      />
    );
  }
  getDivider() {
    return this.props.horizontal ? (
      <View style={[styles.dividerHorizontal, this.props.dividerStyle]} />
    ) : (
      <View style={[styles.dividerVertical, this.props.dividerStyle]} />
    );
  }

  render() {
    const endFadeEnable = this.isEndFadeAllowed();
    return (
      <View
        style={[
          styles.container,
          this.props.containerStyle,
          // eslint-disable-next-line react-native/no-inline-styles
          { flexDirection: this.props.horizontal ? 'row' : 'column' },
        ]}
        onLayout={this._onLayout.bind(this)}
      >
        {this.state.allowStartFade &&
          this.props.allowDivider &&
          this.getDivider()}
        <ScrollView
          {...this.props}
          ref={this.props.innerRef}
          style={[styles.scrollViewStyle, this.props.style]}
          onContentSizeChange={this.onContentSizeChange}
          scrollEventThrottle={16}
          onScroll={this.onScrolled}
        >
          {this.props.children}
        </ScrollView>
        {endFadeEnable &&
          this.state.allowEndFade &&
          this.props.allowDivider &&
          this.getDivider()}
        {this.state.allowStartFade && this.getStartFade()}
        {endFadeEnable && this.state.allowEndFade && this.getEndFade()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollViewStyle: {
    flex: 1,
  },
  startFadeHorizontal: {
    position: 'absolute',
    start: 0,
    height: '100%',
  },
  startFadeVertical: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  endFadeHorizontal: {
    position: 'absolute',
    end: 0,
    height: '100%',
  },
  endFadeVertical: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  dividerHorizontal: {
    width: 1,
    height: '100%',
    backgroundColor: '#E6E6E6',
  },
  dividerVertical: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
  },
});

export default forwardRef<ScrollView, PropsWithChildren<Props>>(
  (props, ref) => <RNFadedScrollView {...props} innerRef={ref} />
);

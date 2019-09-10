import React, {
  FC,
  Fragment,
  HTMLAttributes,
  ReactNode,
  CSSProperties,
  forwardRef,
  useRef,
  useCallback,
  useMemo,
} from "react";
import cn from "classnames";
import { FontIcon } from "@react-md/icon";
import { useFixedPositioning } from "@react-md/transition";
import {
  bem,
  WithForwardedRef,
  DEFAULT_GET_ITEM_VALUE,
  applyRef,
  useToggle,
  useCloseOnOutsideClick,
} from "@react-md/utils";

import Listbox, { ListboxOptions } from "./Listbox";
import TextFieldContainer, {
  TextFieldContainerOptions,
} from "../text-field/TextFieldContainer";
import {
  getOptionId as DEFAULT_GET_OPTION_ID,
  getOptionLabel as DEFAULT_GET_OPTION_LABEL,
} from "./utils";
import FloatingLabel from "../label/FloatingLabel";
import useFocusState from "../useFocusState";

type FakeSelectAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  "placeholder" | "children" | "onChange" | "defaultValue" | "value"
>;

export interface SelectProps
  extends TextFieldContainerOptions,
    ListboxOptions,
    FakeSelectAttributes {
  /**
   * The id for the select component. This is required for a11y and will be used to generate
   * ids for the listbox and each option within the listbox.
   */
  id: string;

  /**
   * Boolean if the select is currently disabled.
   */
  disabled?: boolean;

  /**
   * An optional floating label to use with the select.
   */
  label?: ReactNode;

  /**
   * An optional style to apply to the label element.
   */
  labelStyle?: CSSProperties;

  /**
   * An optional className to apply to the label element.
   */
  labelClassName?: string;

  /**
   * An optional style to apply to the listbox.
   */
  listboxStyle?: CSSProperties;

  /**
   * An optional className to apply to the listbox.
   */
  listboxClassName?: string;

  /**
   * Boolean if the select should act as a read only select field which just allows
   * for all the options to be visible when toggled open.
   */
  readOnly?: boolean;

  /**
   * An optional placeholder text to show while the select is unvalued and is either currently focused
   * or the `label` prop was not provided.
   */
  placeholder?: ReactNode;
}

type WithRef = WithForwardedRef<HTMLDivElement>;
type DefaultProps = Required<
  Pick<
    SelectProps,
    | "portal"
    | "dense"
    | "disabled"
    | "inline"
    | "error"
    | "underlineDirection"
    | "theme"
    | "isLeftAddon"
    | "isRightAddon"
    | "rightChildren"
    | "labelKey"
    | "valueKey"
    | "getOptionId"
    | "getOptionLabel"
    | "getOptionValue"
    | "disableMovementChange"
  >
>;
type WithDefaultProps = SelectProps & DefaultProps & WithRef;

const block = bem("rmd-select");

/**
 * This component is an accessible version of the `<select>` element that allows for
 * some more custom styles by using the `@react-md/list` package to render the list
 * of options.
 *
 * The `Select` component **must be controlled** with a `value` and `onChange` handler.
 */
const Select: FC<SelectProps & WithRef> = providedProps => {
  const {
    onBlur,
    onFocus,
    onKeyDown,
    onClick,
    forwardedRef,
    className,
    label,
    labelStyle,
    labelClassName,
    listboxStyle,
    listboxClassName,
    portal,
    portalInto,
    portalIntoId,
    options,
    labelKey,
    valueKey,
    getOptionId,
    getOptionLabel,
    getOptionValue,
    disableMovementChange,
    readOnly,
    placeholder,
    value,
    onChange,
    ...props
  } = providedProps as WithDefaultProps;
  const { id, disabled, error, dense, leftChildren, rightChildren } = props;

  const valued = typeof value === "number" || !!value;
  const displayValue = useMemo(() => {
    const currentOption = options.find(
      option => getOptionValue(option, valueKey) === value
    );
    if (!currentOption) {
      return null;
    }

    return getOptionLabel(currentOption, labelKey);
  }, [options, valueKey, labelKey, getOptionLabel, getOptionValue, value]);

  const [visible, show, hide] = useToggle(false);
  const [focused, handleFocus, handleBlur] = useFocusState({ onBlur, onFocus });
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(event);
      }

      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          show();
          break;
        case " ":
          event.preventDefault();
          show();
          break;
        case "Enter": {
          const form = event.currentTarget.closest("form");
          if (form) {
            form.submit();
          }
          break;
        }
        // no default
      }
    },
    [onKeyDown, show]
  );

  const selectRef = useRef<HTMLDivElement | null>(null);
  const ref = useCallback(
    (instance: HTMLDivElement | null) => {
      applyRef(instance, forwardedRef);
      selectRef.current = instance;
    },
    [forwardedRef]
  );

  useCloseOnOutsideClick({
    enabled: visible,
    element: selectRef.current,
    onOutsideClick: hide,
  });

  const {
    style: fixedStyle,
    onEnter,
    onEntering,
    onEntered,
    onExited,
  } = useFixedPositioning({
    fixedTo: () => selectRef.current,
    anchor: {
      x: "center",
      y: "below",
    },
    transformOrigin: true,
    equalWidth: true,
    onEntering(node) {
      // can't do onEnter since the positioning styles haven't been applied to the
      // dom node at this time. this means the list is the last element in the DOM
      // when portalled, which causes the page to scroll to the end. Moving it to
      // onEntering will ensure the styles have been applied and won't cause page
      // scrolling
      node.focus();
    },
    onExited() {
      if (selectRef.current) {
        selectRef.current.focus();
      }
    },
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (onClick) {
        onClick(event);
      }

      show();
    },
    [onClick, show]
  );

  return (
    <Fragment>
      <TextFieldContainer
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={disabled ? undefined : handleKeyDown}
        onClick={disabled ? undefined : handleClick}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        role="button"
        tabIndex={disabled ? undefined : 0}
        ref={ref}
        active={focused}
        label={!!label}
        className={cn(block(), className)}
      >
        <FloatingLabel
          style={labelStyle}
          className={cn(block("label"), labelClassName)}
          htmlFor={id}
          error={error}
          active={valued && focused}
          valued={valued}
          floating={focused || valued}
          dense={dense}
          disabled={disabled}
          leftChildren={!!leftChildren}
          rightChildren={!!rightChildren}
          component="span"
        >
          {label}
        </FloatingLabel>
        <span
          className={block("value", {
            disabled,
            readonly: readOnly,
            placeholder: !valued && placeholder,
            "placeholder-active": !valued && placeholder && focused,
          })}
        >
          {displayValue || (!valued && placeholder)}
        </span>
      </TextFieldContainer>
      <Listbox
        id={`${id}-listbox`}
        aria-labelledby={id}
        style={{ ...fixedStyle, ...listboxStyle }}
        className={listboxClassName}
        portal={portal}
        portalInto={portalInto}
        portalIntoId={portalIntoId}
        onEnter={onEnter}
        onEntering={onEntering}
        onEntered={onEntered}
        onExited={onExited}
        value={value}
        onChange={onChange}
        visible={visible}
        temporary
        onRequestClose={hide}
        options={options}
        labelKey={labelKey}
        valueKey={valueKey}
        getOptionId={getOptionId}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        disableMovementChange={disableMovementChange}
      />
    </Fragment>
  );
};

const defaultProps: DefaultProps = {
  portal: true,
  theme: "outline",
  dense: false,
  inline: false,
  error: false,
  disabled: false,
  isLeftAddon: true,
  isRightAddon: true,
  underlineDirection: "left",
  rightChildren: <FontIcon>arrow_drop_down</FontIcon>,
  labelKey: "label",
  valueKey: "value",
  getOptionId: DEFAULT_GET_OPTION_ID,
  getOptionLabel: DEFAULT_GET_OPTION_LABEL,
  getOptionValue: DEFAULT_GET_ITEM_VALUE,
  disableMovementChange: false,
};

Select.defaultProps = defaultProps;

if (process.env.NODE_ENV !== "production") {
  Select.displayName = "Select";

  let PropTypes;
  try {
    PropTypes = require("prop-types");
  } catch (e) {}
  if (PropTypes) {
    Select.propTypes = {
      id: PropTypes.string.isRequired,
      style: PropTypes.object,
      className: PropTypes.string,
      labelStyle: PropTypes.object,
      labelClassName: PropTypes.string,
      listboxStyle: PropTypes.object,
      listboxClassName: PropTypes.string,
      label: PropTypes.node,
      portal: PropTypes.bool,
      portalInto: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.func,
      ]),
      portalIntoId: PropTypes.string,
      labelKey: PropTypes.string,
      valueKey: PropTypes.string,
      getOptionId: PropTypes.func,
      getOptionLabel: PropTypes.func,
      getOptionValue: PropTypes.func,
      disableMovementChange: PropTypes.bool,
      theme: PropTypes.oneOf(["none", "underline", "filled", "outline"]),
      dense: PropTypes.bool,
      error: PropTypes.bool,
      inline: PropTypes.bool,
      readOnly: PropTypes.bool,
      disabled: PropTypes.bool,
      placeholder: PropTypes.node,
      underlineDirection: PropTypes.oneOf(["left", "right"]),
      leftChildren: PropTypes.node,
      rightChildren: PropTypes.node,
      isLeftAddon: PropTypes.bool,
      isRightAddon: PropTypes.bool,
    };
  }
}

export default forwardRef<HTMLDivElement, SelectProps>((props, ref) => (
  <Select {...props} forwardedRef={ref} />
));

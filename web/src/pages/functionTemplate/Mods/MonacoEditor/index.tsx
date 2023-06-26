import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import clsx from "clsx";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import ConfirmButton from "@/components/ConfirmButton";
import { COLOR_MODE } from "@/constants";

import "@/components/Editor/userWorker";

import AddFunctionModal from "../../CreateFuncTemplate/Mods/AddFunctionModal";
import FunctionPopOver from "../FunctionPopover";

monaco?.editor.defineTheme("lafEditorTheme", {
  base: "vs",
  inherit: true,
  rules: [
    {
      foreground: "#0066ff",
      token: "keyword",
    },
  ],
  colors: {
    "editorLineNumber.foreground": "#aaa",
    "editorOverviewRuler.border": "#fff",
    "editor.lineHighlightBackground": "#F7F8FA",
    "scrollbarSlider.background": "#E8EAEC",
    "editorIndentGuide.activeBackground": "#fff",
    "editorIndentGuide.background": "#eee",
  },
});

monaco?.editor.defineTheme("lafEditorThemeDark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    {
      foreground: "65737e",
      token: "punctuation.definition.comment",
    },
  ],
  colors: {
    // https://github.com/microsoft/monaco-editor/discussions/3838
    "editor.foreground": "#ffffff",
    "editor.background": "#202631",
    "editorIndentGuide.activeBackground": "#fff",
    "editorIndentGuide.background": "#eee",
    "editor.selectionBackground": "#101621",
    "menu.selectionBackground": "#101621",
    "dropdown.background": "#1a202c",
    "dropdown.foreground": "#f0f0f0",
    "dropdown.border": "#fff",
    "quickInputList.focusBackground": "#1a202c",
    "editorWidget.background": "#1a202c",
    "editorWidget.foreground": "#f0f0f0",
    "editorWidget.border": "#1a202c",
    "input.background": "#1a202c",
    "list.hoverBackground": "#2a303c",
  },
});

const updateModel = (value: string, editorRef: any) => {
  const newModel = monaco.editor.createModel(value, "typescript");
  if (editorRef.current?.getModel() !== newModel) {
    editorRef.current?.setModel(newModel);
  }
};

const MonacoEditor = (props: {
  value: string;
  title?: string;
  readOnly?: boolean;
  colorMode?: string;
  onChange?: (value: string | undefined) => void;
  currentFunction?: any;
  functionList?: any;
  setFunctionList?: any;
}) => {
  const {
    readOnly,
    value,
    title,
    colorMode,
    onChange,
    currentFunction,
    functionList,
    setFunctionList,
  } = props;
  const monacoEl = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>();
  const subscriptionRef = useRef<monaco.IDisposable | undefined>(undefined);
  const { t } = useTranslation();
  const [showFunction, setShowFunction] = React.useState(true);

  const adjustHeight = () => {
    if (!monacoEl.current) return;

    const model = editorRef.current?.getModel();
    const lineHeight = editorRef.current?.getOption(monaco.editor.EditorOption.lineHeight) || 18;
    const lineCount = model?.getLineCount() || 1;
    const newHeight = lineCount * lineHeight;

    monacoEl.current.style.height = `${newHeight}px`;
    editorRef.current?.layout();
  };

  useEffect(() => {
    if (monacoEl && !editorRef.current) {
      editorRef.current = monaco.editor.create(monacoEl.current!, {
        value: value,
        minimap: {
          enabled: false,
        },
        language: "typescript",
        readOnly: readOnly,
        scrollBeyondLastLine: false,
        scrollbar: {
          vertical: "hidden",
          alwaysConsumeMouseWheel: false,
        },
        mouseWheelScrollSensitivity: 0,
        formatOnPaste: true,
        overviewRulerLanes: 0,
        lineNumbersMinChars: 4,
        fontSize: 14,
        theme: colorMode === COLOR_MODE.dark ? "lafEditorThemeDark" : "lafEditorTheme",
      });

      editorRef.current.onDidChangeModelContent(() => {
        adjustHeight();
      });
    }

    updateModel(value, editorRef);
    adjustHeight();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFunction]);

  useEffect(() => {
    subscriptionRef.current?.dispose();
    if (onChange) {
      subscriptionRef.current = editorRef.current?.onDidChangeModelContent(() => {
        onChange(editorRef.current?.getValue());
      });
    }
  }, [onChange]);

  useEffect(() => {
    if (monacoEl && editorRef.current) {
      editorRef.current.updateOptions({
        theme: colorMode === COLOR_MODE.dark ? "lafEditorThemeDark" : "lafEditorTheme",
      });
    }
  }, [colorMode]);

  return (
    <div
      className={clsx(
        "h-full overflow-hidden rounded-md border",
        colorMode === COLOR_MODE.dark ? "bg-[#202631]" : "bg-white",
      )}
    >
      <div
        className={clsx(
          "flex h-8 w-full items-center justify-between rounded-t-md px-6 text-lg font-semibold",
          colorMode === COLOR_MODE.dark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800",
        )}
        placeholder="Function Name"
        style={{ outline: "none", boxShadow: "none" }}
      >
        <span className="flex items-center">
          {title}
          <span className="ml-3 text-grayIron-600">
            <FunctionPopOver currentFunction={currentFunction} />
          </span>
        </span>
        <span>
          {!readOnly && (
            <span className="text-grayIron-600">
              <AddFunctionModal
                functionList={functionList}
                setFunctionList={setFunctionList}
                currentFunction={currentFunction}
                isEdit={true}
              >
                <EditIcon
                  boxSize={3}
                  color={"grayModern.900"}
                  className={clsx("mr-6 cursor-pointer hover:text-gray-400")}
                />
              </AddFunctionModal>
              <ConfirmButton
                onSuccessAction={async () => {
                  const updatedFunctionList = functionList.filter(
                    (func: any) => func.name !== currentFunction?.name,
                  );
                  setFunctionList(updatedFunctionList);
                }}
                headerText={String(t("Delete"))}
                bodyText={String(t("FunctionPanel.DeleteConfirm"))}
              >
                <DeleteIcon
                  boxSize={3}
                  color={"grayModern.900"}
                  className={clsx("mr-6 cursor-pointer hover:text-gray-400")}
                />
              </ConfirmButton>
            </span>
          )}
          <ChevronDownIcon
            boxSize={4}
            color={"grayModern.900"}
            className={clsx("cursor-pointer hover:text-gray-400")}
            onClick={() => setShowFunction(!showFunction)}
          />
        </span>
      </div>
      <div ref={monacoEl} className={clsx("mb-2 mt-1", showFunction ? "" : "hidden")} />
    </div>
  );
};

export default MonacoEditor;
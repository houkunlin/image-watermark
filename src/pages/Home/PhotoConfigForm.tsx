import { Divider, Modal } from "antd";
import {
  FormInstance,
  ProForm,
  ProFormColorPicker,
  ProFormDigit,
  ProFormGroup,
  ProFormItem,
  ProFormList,
  ProFormRadio,
  ProFormText
} from "@ant-design/pro-components";
import { ConfigType, TextConfig } from "@/pages/Home/commons";
import { EditOutlined } from "@ant-design/icons";
import React from "react";
import { useDebounceFn } from "ahooks";

const defaultText = new TextConfig({
  x: 100,
  y: 250,
  color: '#000',
  fontSize: 8,
  fontSizeUnit: 'em',
  textTpl: '{{相机品牌}} {{相机型号}}',
  textBaseline: 'top',
  textAlign: 'left',
  fontWeight: 'normal',
});

type PhotoConfigFormProps = {
  defaultValue: ConfigType;
  onChange: (value: ConfigType) => void;
  formRef: React.MutableRefObject<FormInstance | undefined>;
}

function PhotoConfigForm(props: Readonly<PhotoConfigFormProps>) {
  const { defaultValue, onChange, formRef } = props;

  const { run: setConfigDebounceFn } = useDebounceFn((changedValues, values) => {
    onChange({ ...values });
  }, { wait: 200 });

  return (
    <ProForm
      formRef={formRef}
      submitter={{ render: (props, dom) => null, }}
      onValuesChange={setConfigDebounceFn}
      request={async (params) => ({ ...defaultValue })}
    >
      <Divider orientation={'left'}>画布</Divider>
      <ProFormGroup>
        <ProFormColorPicker
          name={'background'}
          label={'背景颜色'}
          getValueFromEvent={args => args.toHexString()}
          fieldProps={{
            // @ts-ignore
            showText: true,
            style: { display: 'inline-flex', width: "auto" },
            format: 'hex',
          }} />
        <ProFormDigit name={['border', 'left']} label={'左边'} width={'xs'} addonAfter={'px'} />
        <ProFormDigit name={['border', 'top']} label={'顶边'} width={'xs'} addonAfter={'px'} />
        <ProFormDigit name={['border', 'right']} label={'右边'} width={'xs'} addonAfter={'px'} />
        <ProFormDigit name={['border', 'bottom']} label={'底边'} width={'xs'} addonAfter={'px'} />
      </ProFormGroup>
      <Divider orientation={'left'}>文字</Divider>
      <ProFormList<TextConfig>
        name={'textItems'}
        creatorButtonProps={{ creatorButtonText: '添加文字', }}
        creatorRecord={{ ...defaultText, }}
      >
        {(meta, index, action, count) => {
          const data = action.getCurrentRowData();
          const openDrawer = data.openDrawer;
          // console.log('ProFormList', meta, index, action, count, data);
          return <ProFormGroup>
            <ProFormText name={'textTpl'} label={'文字'} width={'lg'} />
            <ProFormDigit name={'x'} label={'X坐标'} width={'xs'} addonAfter={'px'} />
            <ProFormDigit name={'y'} label={'Y坐标'} width={'xs'} addonAfter={'px'} />
            <ProFormItem label={'操作'}>
              <a type={'link'}
                 onClick={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}>
                编辑样式 <EditOutlined />
              </a>
            </ProFormItem>
            <Modal
              title={'样式编辑'}
              open={openDrawer}
              width={960}
              // onClose={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}
              onCancel={() => action.setCurrentRowData({ ...data, openDrawer: !openDrawer })}
              maskClosable={true}
              centered={true}
              footer={false}
            >
              <ProFormDigit name={'fontSize'} label={'字体大小'} width={'lg'} />
              <ProFormRadio.Group
                radioType={"button"}
                fieldProps={{ buttonStyle: 'solid' }}
                name={'fontSizeUnit'}
                label={'字体单位'}
                options={['pt', 'px', 'em', 'rem', 'in',]} />
              <ProFormRadio.Group
                radioType={"button"}
                fieldProps={{ buttonStyle: 'solid' }}
                name={'textBaseline'} label={'文字基线'}
                options={['top', 'middle', 'bottom', 'ideographic', 'hanging', 'alphabetic',]} />
              <ProFormRadio.Group
                radioType={"button"}
                fieldProps={{ buttonStyle: 'solid' }}
                name={'textAlign'}
                label={'文字对齐'}
                options={['left', 'right', 'center', 'end', 'start',]} />
              <ProFormRadio.Group
                radioType={"button"}
                fieldProps={{ buttonStyle: 'solid' }}
                name={'fontWeight'}
                label={'字体粗细'}
                options={['normal', 'bold', 'bolder', 'lighter',]} />
              <ProFormColorPicker
                name={'color'}
                label={'文字颜色'}
                getValueFromEvent={args => args.toHexString()}
                fieldProps={{
                  // @ts-ignore
                  showText: true,
                  style: { display: 'inline-flex', width: "auto" },
                  format: 'hex',
                }}
              />
            </Modal>
          </ProFormGroup>
        }}
      </ProFormList>
    </ProForm>
  )
}

export default PhotoConfigForm;

import { map } from 'lodash';
import titleCase from 'title-case';
import {
  Component, Prop, Watch, Vue, Inject, Provide,
} from 'vue-property-decorator';
import {
  Popconfirm, Table, Dropdown, Menu, Button, Icon,
} from 'ant-design-vue';
import { tableList, operate, Directives } from '@/interface';
import Spin from '@/components/Spin';
import { api } from '@/api';
import { getValue } from '@/utils/helper';
import './MTable.less';

@Component({
  components: {
    'a-table': Table,
    'a-popconfirm': Popconfirm,
    'm-spin': Spin,
    'a-dropdown': Dropdown,
    'a-menu-item': Menu.Item,
    'a-menu': Menu,
    'a-button': Button,
    'a-icon': Icon,
  },
})
export default class MTable extends Vue {
  @Prop() private tableList!: tableList[];

  @Prop() private url!: string;

  @Prop() private dataType!: string;

  @Prop({
    default: () => ({
      code: 'data.result.resultCode',
      codeOK: '0',
      message: 'data.result.resultMessage',
      data: 'data.entity',
      columns: 'config.params.columns',
      total: 'config.params.pageParams.total',
    }),
  }) private backParams!: {
    code: string,
    message: string,
    data: string,
    columns: string,
    codeOK: string | number,
    total: string
  };

  // 外部参数
  @Prop({ default: {} })
  private outParams!: any;

  // 行ID
  @Prop({ default: 'id' }) private rowKey!: string;

  // 操作栏数据
  @Prop({ default: () => [] }) private operate!: operate[];

  // 操作栏width
  @Prop({ default: '150px' }) private operateWidth!: string;

  // 本地存储名称
  @Prop({ default: 'filter-table' }) private localName!: string;

  // 请求报错回调
  @Prop() private fetchError!: Function;

  // 表格列数据
  @Prop() private tableParams!: any;

  // 请求类型
  @Prop({ default: 'get' }) private fetchType!: string;

  // 表格分页大小参数
  @Prop({ default: () => ['5', '10', '15', '20', '50', '100'] }) private pageSizeList!: number[];

  @Prop({ default: 50 }) private defaultPageSize!: number;

  @Prop() private highlightCurrentRow!: boolean;

  @Prop({ default: null }) private scroll!: {x: number, y: number};

  // data
  tableData: any[] = [];

  pageParams: {
    pageSize: number,
    pageNum: number,
    page: boolean,
  } = {
    pageSize: this.defaultPageSize,
    pageNum: 1,
    page: true,
  };

  loading: boolean = false;

  // 数据总数
  dataTotal: number = 0;

  get ids() {
    return map(this.tableData, 'id');
  }

  @Watch('ids')
  idsChanged(newValue: any[]) {
    this.$log.info('[表格] ---> 更新数据唯一标识符集合: ', newValue);
  }

  @Watch('tableData')
  tableDataChanged(newValue: any[]) {
    this.$log.info('[表格] ---> 数据记录总数 ', newValue.length);
  }

  constructor(props: any) {
    super(props);
    const self = this;
  }

  created() {
    this.getData();
  }

  activated() {
    this.getData();
  }

  reload() {
    this.pageParams.pageNum = 1;
    this.getData();
  }

  /**
   * @method 获取表格数据
   */
  getData(): void {
    this.$log.info('[表格] ---> 开始异步获取数据');
    this.loading = true;
    const params = {
      pageParams: { ...this.pageParams },
      filter: { ...this.tableParams },
      out: { ...this.outParams },
    };
    this.$log.info('[表格] ---> 异步获取数据参数:', params);
    api.request({
      url: this.url,
      method: this.fetchType,
      params,
    }).then((res) => {
      this.$log.info('[表格] ---> 异步获取数据结果:', res);
      this.loading = false;
      const code: number = getValue(this.backParams.code, res);
      if (code === this.backParams.codeOK) {
        this.tableData = getValue(this.backParams.data, res);
        this.$log.suc('MTable table data:', this.tableData);
        // 自动生成全部表格列
        // this.tableList = getValue(this.backParams.columns, res);
        // 计算表格总数
        this.dataTotal = getValue(this.backParams.total, res)
          ? getValue(this.backParams.total, res) : 0;
      } else {
        this.$message.error(getValue(this.backParams.message, res));
      }
    });
  }

  /**
   * @method 获取表格数据
   */
  getAjaxData() {
    this.loading = true;
    window.ajax.request({
      url: this.url,
      method: this.fetchType,
      fetchType: this.dataType,
      data: Object.assign(
        this.tableParams ? this.tableParams : {},
        this.pageParams,
        this.outParams,
      ),
    }).then((res: any) => {
      this.loading = false;
      const code = getValue(this.backParams.code, res);
      if (code === this.backParams.codeOK) {
        this.tableData = getValue(this.backParams.data, res);
        this.dataTotal = getValue(this.backParams.total, res)
          ? getValue(this.backParams.total, res) : 0;
      } else {
        this.$message.error(getValue(this.backParams.message, res));
      }
    });
  }

  // 选择变化
  selectChange(val: any) {
    this.$emit('selectChange', val);
  }

  // 单选
  currentChange(val: any) {
    this.$emit('currentChange', val);
  }

  render() {
    // 添加表格的操作列属性 Generate table action columns
    if (this.operate.length && this.tableList[this.tableList.length -1].title !== '操作') {
      this.tableList.push({
        title: '操作',
        dataIndex: 'action',
        width: this.operateWidth,
        customRender: this.renderOperate,
      });
    }
    // 生成表格的列属性 Generate table  columns
    const tableList = this.tableList.reduce((list: tableList[], item: tableList) => {
      const title = `${this.$t(item.dataIndex).toString()} / ${titleCase(item.dataIndex)}`;
      list.push({
        ...item,
        title,
        sorter: true,
      });
      return list;
    }, []);
    return (
      <div class="m-table" >
        <a-table
          bordered
          loading={this.loading}
          rowKey={this.rowKey}
          dataSource={this.tableData}
          scroll={this.scroll}
          pagination={{
            current: this.pageParams.pageNum,
            defaultPageSize: this.defaultPageSize,
            pageSize: this.pageParams.pageSize,
            pageSizeOptions: this.pageSizeList,
            showQuickJumper: true,
            showSizeChanger: true,
            total: this.dataTotal,
          }}
          columns={tableList}
          on-change={this.tableChange}
        >
        </a-table>
      </div>
    );
  }

  /**
   * @method 操作栏的渲染函数，参数对应antd的Columns>customRender的参数
   * @param {any} text 当前列的值
   * @param {object} record 当前行的值
   * @param {number} index 当前列的序列号
   */
  renderOperate(text: any, record: any, index: number) {
    // 操作超过4个，就用下拉菜单方式
    if (this.operate.length > 4) {
      return <a-dropdown on-command={(command: string) => this.menuClick(command, record)}>
        <a-button type="dashed" size="small" style="margin-left: 8px">
          操作栏 <a-icon type="down" />
        </a-button>
        <a-menu slot="overlay">
          {
            this.operate.map((item, indexs) => <a-menu-item
              key={indexs}
              command={item.key}
              disabled={item.disabled && item.disabled(record)}
            >
              {typeof item.text === 'function' ? item.text(record) : item.text}
            </a-menu-item>)
          }
        </a-menu>
      </a-dropdown>;
    }
    // 普通模式
    return <div class="table-operate">
      {
        this.operate.map((item, indexs) => {
          const whiteList = ['red', 'orange'];
          if (item.disabled && item.disabled(record)) {
            return <a id={`${item.key}-${record[item.rowKey]}`} key={indexs} class="btn disabled">
              { typeof item.text === 'function' ? item.text(record) : item.text }
            </a>;
          } if (whiteList.indexOf(typeof item.color === 'function' ? item.color(record) : item.color) >= 0) {
            return <a-popconfirm
              on-confirm={() => this.menuClick(item.key, record)}
              title={typeof item.msg === 'function' ? item.msg(record) : item.msg}>
              <a id={`${item.key}-${record[item.rowKey]}`} key={indexs} class={`link-${typeof item.color === 'function' ? item.color(record) : item.color}`}>
                { typeof item.text === 'function' ? item.text(record) : item.text }
              </a>
            </a-popconfirm>;
          }
          return <a id={`${item.key}-${record[item.rowKey]}`} class={`link-${typeof item.color === 'function' ? item.color(record) : item.color}`} key={indexs} on-click={() => this.menuClick(item.key, record)}>{typeof item.text === 'function' ? item.text(record) : item.text}</a>;
        })
      }
    </div>;
  }

  // page, filter, sorter changed
  tableChange(pagination: any, filters: any, sorter: any) {
    this.$log.info('[标题] ---> 分页过滤排序变化');
    this.pageParams.pageSize = pagination.pageSize;
    this.pageParams.pageNum = pagination.current;
    this.getData();
    // this.$emit('tableChange', this.pageParams, filters, sorter);
  }

  // when action menu clicked
  menuClick(key: string, row: any) {
    this.$emit('tableClick', key, row);
  }
}

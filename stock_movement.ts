export const getStockMovement = () => `
folder: retail stock movement
type: fact
source: 
  schema.stock_movement:
    columns: 
      - <all>

hierarchies:
  merchandise:
    - level_name: company
      attributes: []
    - level_name: division
      attributes:
        - division_id
        - division_description
    - level_name: group
      attributes:
        - group_id
        - group_description
    - level_name: department
      attributes:
        - department_id
        - department_description
      drill_across:
        - target_hierarchy: location
          target_level_name: store
    - level_name: class
      attributes:
        - class_id
        - class_description
    - level_name: subclass
      attributes:
        - subclass_id
        - subclass_description
      drill_across:
        - target_hierarchy: location
          target_level_name: area
    - level_name: item
      attributes:
        - item
        - item_description
  location:
    - level_name: store
      attributes:
        - location_id
        - location_description
    - level_name: region
      attributes:
        - region_id
        - region_description
    - level_name: district
      attributes:
        - district_id
        - district_description
    - level_name: chain
      attributes:
        - chain_id
        - chain_description
    - level_name: area
      attributes:
        - area_id
        - area_description
  time:
    - level_name: year
      attributes: []
    - level_name: quarter
      attributes: []
    - level_name: month
      attributes: []
    - level_name: week
      attributes: []
    - level_name: day
      attributes: []
  
attributes:
  store:
    name: store
    synonym:
      - location
    description: location id and location description
    include: 
      - location_id
      - location_description
    
  region:
    name: region
    description: region id and region description
    include:
      - region_id
      - region_description
    
  district:
    name: district
    description: district id and district description
    include:
      - district_id
      - district_description
    
  chain:
    name: chain
    description: chain id and chain description
    include: 
      - chain_id
      - chain_description
    
  area:
    name: area
    description: area id and area description
    include:
      - area_id
      - area_description

  item:
    name: item
    synonym:
      - product
      - merchandise
    description: item id and item description
    include:
      - item_id 
      - item_description

  subclass:
    name: subclass
    synonym:
      - sub-category
    description: subclass id, subclass description, class id, class description, department id, and department description
    include:
      - subclass_id
      - subclass_description

  class:
    name: class
    synonym:
      - category
    description: class id, class description
    include:
      - class_id
      - class_description

  department:
    name: department
    description: department id and department description
    include: 
      - department_id
      - department_description

  division:
    name: division
    description: division id and division description
    include:
      - division_id
      - division_description

  group:
    name: group
    description: group id and group description
    include: 
      - group_id
      - group_description

  sales_amount:
    name: sales amount
    synonym:
      - sales value
    description: sales amount
    calculation: "[sales_amount]"
    granularity:
      - item
      - location
      - day

  sales_cost:
    name: sales cost
    synonym:
      - cost of goods sold
      - cogs
    description: sales cost
    calculation: "[sales_cost]"

  sales_quantity:
    name: sales quantity
    synonym:
      - sales quantity
    description: sales quantity
    calculation: "[sales_quantity]"

  total_sales:
    name: total sales
    synonym:
      - sales
    description: sales amount
    calculation: "[sales_amount]"
    function: sum

  net_clearance_sales_amount:
    name: net clearance sales amount
    description: this is the total clearance sales amount
    calculation: "[clearance_sales_amount]"

  net_clearance_sales_quantity:
    name: net clearance sales quantity
    description: this is the total clearance sales quantity
    calculation: "[clearance_sales_quantity]"

  net_employee_discount:
    name: net employee discount
    synonym:
      - discount amount 
      - net discount amount 
      - employee discount amount
    description: employee_discount_amount
    calculation: "[employee_discount_amount]"

  on_hand_quantity:
    name: on hand quantity
    synonym:
      - stock quantity
      - inventory on hand
    description: inventory on hand quantity
    calculation: "[inventory_onhand_quantity]"
    granularity:
      - item
      - location
      - day

  on_hand_cost:
    name: on hand cost
    synonym:
      - stock on hand cost
      - stock on hand cost amount
      - inventory on hand cost
      - inventory on hand cost amount
    definition: inventory on hand cost amount
    description: inventory on hand cost amount
    calculation: "[inventory_onhand_cost_amount]"
    granularity:
      - item
      - location
      - day

  on_hand_retail:
    name: on hand retail
    synonym:
      - stock on hand retail
      - stock on hand retail amount
      - inventory on hand retail
      - inventory on hand retail amount
    description: inventory on hand retail amount
    calculation: "[inventory_onhand_retail_amount]"
    granularity:
      - item
      - location
      - day

  on_hands:
    name: on hands
    synonym:
      - on hand inventory
      - onhands
      - onhands inventory
    definition: on hands must show on hand quantity, cost and retail amount.
    include:
      - on_hand_quantity
      - on_hand_cost
      - on_hand_retail
    description: on hands quantity, retail and cost amount
    granularity:
      - item
      - location
      - day

  inventory_intransit_quantity:
    name: in transit quantity
    description: inventory in transit quantity
    synonym:
      - inventory transit quantity
      - inventory in transit
    # calculation: "[inventory_intransit_quantity]"
    granularity:
      - item
      - location
      - day

  on_order_quantity:
    name: on order quantity
    definition: inventory on order quantity
    description: inventory on order quantity
    calculation: "[inventory_onorder_quantity]"
    granularity:
      - item
      - location
      - day

  inventory_positions:
    name: inventory positions
    synonym:
      - inventory status
      - inventories
      - inventory_positions
    definition: inventory on hand quantity, inventory on order quantity and inventory in transit quantity in item, location and day level
    description: inventory on hand quantity, inventory on order quantity and inventory in transit quantity
    include: 
      - inventory_onhand_quantity
      - inventory_onorder_quantity
      - inventory_intransit_quantity

  eoh:
    name: eoh
    synonym:
      - end on hand
    description: eoh (end of hand) refers to inventory quantities organized by each item within specific locations and on specified dates. when discussing 'eoh' for a particular timeframe, such as 'january 2021' or 'week 3, 2021,' it specifically denotes the exact inventory quantity at the conclusion of that period, typically referencing the 'inventory_onhand_quantity' column in data warehouses or inventory management systems. for example, 'eoh of january 2021' represents the inventory count as of january 31, 2021, while 'eoh of week 3, 2021' indicates the inventory quantity at the end of the third week of 2021. similarly, 'eoh of 2021' signifies the inventory amount on december 31, 2021. it's important to note that the 'sum' aggregate function isn't universally applicable across this time hierarchy, necessitating separate calculations for each period's inventory quantity.
    definition: inventory quantities organized by each item in specific locations and on specified dates. when referring to 'eoh' for a particular timeframe, such as 'january 2021' or 'week 3, 2021,' it denotes the inventory quantity at the period's conclusion, typically referencing the 'inventory_onhand_quantity' column.
    granularity:
      - item
      - location
      - date
    function: last

  boh:
    name: boh
    synonym:
      - beginning on hand
    definition: dataset contains detailed information about inventory quantities, organized by individual items and specific dates. when someone asks for the 'boh' (beginning of period) of a particular timeframe, such as 'january 2021' or 'week 3, 2021,'' they're seeking the inventory quantity at the beginning of that period, referencing the 'inventory_boh_quantity' column. for instance, 'boh of january 2021' signifies the inventory count at the commencement of january 1, 2021, while 'boh of week 3, 2021' indicates the inventory quantity at the beginning of the third week of 2021. similarly, if they inquire about the 'boh of 2021,' it pertains to the inventory amount on january 1, 2021. it's important to note that the 'sum' aggregate function isn't applicable across this time hierarchy; therefore, each period's inventory quantity needs to be calculated separately. this understanding allows for precise retrieval of inventory data for various timeframes based on specific dates or time intervals. eoh must be shown with item, location and date. use inventory_onhand_quantity column.
    description: beginning on hand
    hidden: false
    function: first

  transfer_in_quantity:
    name: transfer in quantity
    definition: in quantity through inventory transfer
    description: in quantity through inventory transfer
    calculation: "[inventory_transfer_in_quantity]"

  transfer_out_quantity:
    name: transfer out quantity
    definition: out quantity through inventory transfer
    description: transfer out quantity is outgoing quantity through inventory transfer
    calculation: "[inventory_transfer_out_quantity]"

  transfer_in_cost:
    name: transfer in cost
    description: inventory_transfer_in_cost_amount
    definition: cost of transfer in inventory
    calculation: "[inventory_transfer_in_cost_amount]"

  transfer_out_cost:
    name: transfer out cost
    definition: transfer out cost is the cost of transfer out inventory
    description: cost of transfer out inventory
    calculation: "[inventory_transfer_out_cost_amount]"

  transfer_in_retail:
    name: transfer in retail
    description: transfer out cost is the retail of transfer out inventory
    definition: retail amount of transfer out inventory
    calculation: "[inventory_transfer_in_retail_amount]"

  transfer_out_retail:
    name: transfer out retail
    description: inventory_transfer_out_retail_amount
    definition: inventory_transfer_out_retail_amount
    calculation: "[inventory_transfer_out_retail_amount]"

  transfer_ins:
    name: transfer ins
    description: it needs to show inventory_transfer_in_quantity, inventory_transfer_in_cost_amount, inventory_transfer_in_retail_amount
    definition: transfer ins contains transfer in quantity, transfer in cost, transfer in retail.
    include:
      - transfer_in_quantity
      - transfer_in_cost
      - transfer_in_retail

  transfer_outs:
    name: transfer outs
    description: it needs to show inventory transfer out quantity, cost and retail
    definition: it needs to show transfer out quantity, cost and retail
    include:
      - transfer_out_quantity
      - transfer_out_cost
      - transfer_out_retail

  transfers:
    name: transfers
    synonym:
      - inventory transfers
    description: it needs to show transfer in and out in terms of quantity, cost and retail
    include:
      - transfer_in_quantity
      - transfer_in_cost
      - transfer_in_retail
      - transfer_out_quantity
      - transfer_out_cost
      - transfer_out_retail
    granularity:
      - location
  
  adjusted_quantity:
    name: adjusted quantity
    synonym:
      - inventory adjustment quantity
      - inventory adjusted quantity
      - adjusted inventory quantity
      - adjusted quantity
    definition: inventory adjustment quantity
    description: inventory adjustment quantity
    calculation: "[inventory_adjustment_quantity]"

  adjusted_cost:
    name: adjusted cost
    synonym:
      - inventory adjustment cost
      - inventory adjusted cost
      - adjusted cost
      - adjustment cost
      - adjusted inventory cost
    definition: inventory adjustment cost amount
    description: inventory adjustment cost amount
    calculation: "[inventory_adjustment_cost_amount]"

  adjusted_retail:
    name: adjusted retail
    synonym:
      - inventory adjustmen retail
      - inventory adjustment retail
      - adjustment retail
      - adjusted retail amount
      - adjusted inventory retail
    definition: inventory adjustment retail amount
    description: inventory adjustment retail amount
    calculation: "[inventory_adjustment_retail_amount]"

  adjustments:
    name: adjustments
    synonym:
      - inventory adjustments
      - total adjustments
    description: adjustment quantity, adjustment cost and adjustment retail
    include:
      - adjusted_quantity
      - adjusted_cost
      - adjusted_retail

  rtv_quantity:
    name: rtv quantity
    synonym:
      - inventory return to vendor quantity
      - return to vendor quantity
      - inventory rtv quantity
      - rtv inventory quantity
    definition: inventory return to vendor quantity
    description: inventory return to vendor quantity
    calculation: "[inventory_rtv_quantity]"

  rtv_cost:
    name: rtv cost
    synonym:
      - inventory return to vendor cost
      - return to vendor cost
      - inventory rtv cost
      - rtv inventory cost
    definition: inventory adjustment cost amount
    description: inventory adjustment cost amount
    calculation: "[inventory_rtv_cost_amount]"

  rtv_retail:
    name: rtv retail
    synonym:
      - return to vendor retail
      - inventory return to vendor retail
      - inventory rtv retail
      - rtv inventory retail
    definition: inventory adjustment retail amount
    description: inventory adjustment retail amount
    calculation: "[inventory_rtv_retail_amount]"

  rtv:
    name: rtvs
    synonym:
      - return to vendors
      - negative pos
      - rtv
      - negative purchases
      - negative purchase orders
    description: rtvs contains rtv quantity, rtv cost and rtv retail
    definition: rtvs must show rtv quantity, rtv cost and rtv retail
    include:
      - rtv_quantity
      - rtv_cost
      - rtv_retail

  markdown_quantity:
    name: inventory markdown quantity
    synonym:
      - markdown_quantity
    description: quantity of markdown executed in inventory
    definition: inventory markdown quantity
    column: inventory_markdown_quantity
    calculation: "[inventory_markdown_quantity]"

  markdown_retail_amount:
    name: inventory markdown retail amount
    synonym:
      - markdown amount
      - markdown retail amount
    description: retail value of markdown executed in inventory
    definition: inventory markdown retail amount
    column: inventory_markdown_retail_amount
    # calculation: "[inventory_markdown_retail_amount]"

  markup_quantity:
    name: markup quantity
    synonym:
      - inventory markup quantity
    description: quantity of markup executed in inventory
    definition: inventory markup quantity
    calculation: "[inventory_markup_quantity]"

  markup_retail_amount:
    name: markup retail amount
    synonym:
      - markup amount
      - inventory markup retail_amount
    description: retail value of markup executed in inventory
    definition: inventory markup retail amount
    column: inventory_markup_retail_amount
    # calculation: "[inventory_markup_retail_amount]"

  markdowns:
    name: markdowns
    synonym:
      - inventory markdowns
    description: markdown quantity, retail amount and cost amount
    definition: markdowns need to show markdown quantity, retail and cost amount
    include:
      - inventory_markdown_quantity
      - inventory_markdown_retail_amount

  markups:
    name: markups
    synonym:
      - inventory markups
    description: markups show markup quantity, retail and cost amount
    definition: markups need to show markup quantity, retail and cost amount
    include:
      - markup_quantity
      - markup_retail_amount

  markdown_cancel_quantity:
    name: inventory markdown cancel quantity
    synonym:
      - markdown cancel quantity
    description: quantity of markdown cancel executed in inventory
    definition: inventory markdown cancel quantity
    calculation: "[inventory_markdown_cancel_quantity]"

  markdown_cancel_retail_amount:
    name: inventory markdown cancel retail amount
    synonym:
      - markdown cancel amount
      - markdown cancel retail amount
    description: retail value of markdown cancel executed in inventory
    definition: inventory markdown cancel retail amount
    calculation: "[inventory_markdown_cancel_amount]"

  markup_cancel_quantity:
    name: markup cancel quantity
    synonym:
      - inventory_markup_cancel_quantity
    description: quantity of markup cancel executed in inventory
    definition: inventory markup cancel quantity
    calculation: "[inventory_markup_cancel_quantity]"


  markup_cancel_retail_amount:
    name: markup cancel retail amount
    synonym:
      - markup cancel amount
      - markup cancel retail amount
    description: retail value of markup cancel executed in inventory
    definition: inventory markup cancel retail amount
    calculation: "[inventory_markup_cancel_amount]"

  markdowns_cancel:
    name: markdowns cancel
    synonym:
      - inventory_markdowns_cancel
    description: markdowns cancel shows markdown cancel quantity, cancel retail amount and cancel cost amount
    definition: markdowns cancel need to show markdown cancel quantity, cancel cost and retail amount
    include:
      - inventory_markdown_cancel_quantity
      - inventory_markdown_cancel_retail_amount

  markups_cancel:
    name: markups cancel
    synonym:
      - inventory_markups_cancel
    description: markup cancel shows markup cancel quantity, cancel retail amount and cancel cost amount
    definition: markups cancel need to show markup cancel quantity, cancel cost and retail amount
    include:
      - markup_cancel_quantity
      - markup_cancel_retail_amount

  return_sales_amount:
    name: return sales amount
    synonym:
      - return sales
    description: return sales amount
    calculation: "[return_sales_amount]"

  total_discount_amount:
    name: total discount amount
    synonym:
      - discount amount
      - total discount amount
    description: total discount amount
    calculation: "[total_discount_amount]" 
  
  YTD: 
    name: YTD
    description: Year to Date (YTD as of September 10th would measure performance from January 1st to September 10th.)
    synonym:
      - year to date
  
  MTD: 
    name: MTD
    description: Month to Date (if today's date is September 10th, MTD would track performance from September 1st to September 10th.)
    synonym:
      - month to date
      - Month To Date
  
metrics: 
  profit:
    name: profit
    synonym:
      - margin
      - total profit
      - total margin
      - gross profit
    description: profit is the difference between sales amount and cost amount
    calculation: "[sales_amount] - [sales_cost]"
    granularity:
      - item
      - location
      - day

  stock_to_sales_ratio:
    name: stock to sales ratio
    definition: stock to sales ratio is the ratio of inventory on hand quantity to the sales quantity
    description: inventory on hand quantity divided by sales quantity
    calculation: "[sales_quantity] / [on_hand_quantity]"
    granularity:
      - item
      - location
      - day

  AUR:
    name: AUR
    description: Average Unit Retail 
    synonym:
      - average unit retail
      - aur
    calculation: "sum([sales_amount])/sum([sales_quantity])"

  net sales:
    name: net sales
    synonym:
      - Net sales
      - Net Sales 
    calculation: "[sales_amount]-[return_sales_amount]-[total_discount_amount]"
  
  AUC: 
    name: AUC
    description: Average Unit Cost
    synonym:
      - auc 
      - average unit cost
    calculation: "sum([sales_cost])/sum([sales_quantity])"

  Gross Margin %:
    name: Gross Margin %
    synonym:
      - Gross Margin
      - Gross Margin %
      - Gross Margin Percentage
      - gross margin percentage
      - Margin %
    calculation: "([sales_amount] - [sales_cost])/[sales_amount]"

  net_clearance_profit:
    name: net clearance profit
    synonym:
      - clearance profit
    description: this is the difference between sales amount and cost amount for clearance price items
    calculation: "[clearance_sales_amount] - [clearance_sales_cost]"
    include: 
      - clearance_sales_amount
      - clearance_sales_cost

  clearance_sales:
    name: clearance sales
    synonym:
      - stock clearance sales
      - inventory clearance sales
    description: clearance sales amount and quantity
    calculation: "[clearance_sales_amount] * [clearance_sales_quantity]"
    include:
      - clearance_sales_amount
      - clearance_sales_quantity

  promotional_sales:
    name: promotional sales
    description: promotional sales refers to sales amount and quantity of promotional items
    synonym:
      - total promotional sales amount
      - total promotional sales
      - promotional sale
    calculation: "[promotional_sales_amount] * [promotional_sales_quantity]"
    include:
      - promotional_sales_amount
      - promotional_sales_quantity

  regular_sales:
    name: regular sales
    description: regular sales amount and quantity
    calculation: "[regular_sales_amount] * [regular_sales_quantity]"
    include:
      - regular_sales_amount
      - regular_sales_quantity

  regular_cost:
    name: regular cost
    description: regular cost amount and quantity
    calculation: "[regular_sales_cost] * [regular_sales_quantity]"
    include:
      - regular_sales_cost
      - regular_sales_quantity

  regular_profit:
    name: regular profit
    synonym:
      - regular margin
      - regular profit
      - total regular profit
    description: regular profit is the difference between regular sales amount and regular cost amount
    calculation: "[regular_sales_amount] - [regular_sales_cost]"

  clearance_profit:
    name: clearance profit
    synonym:
      - clearance margin
      - clearance profit
      - total clearance profit
    description: clearance profit is the difference between clearance sales amount and clearance cost amount
    calculation: "[clearance_sales_amount] - [clearance_sales_cost]"

  promotional_profit:
    name: promotional profit
    synonym:
      - promotional margin
      - promotional profit
      - total promotional profit
    description: promotional profit is the difference between promotional sales amount and promotional cost amount
    calculation: "[promotional_sales_amount] - [promotional_sales_cost]"

  loss:
    name: loss
    description: loss is the profit with negative values
    calculation: "-[profit]"
  
  var:
    name: var
    synonym:
      - variance
      - net var
      - net variance 
    description: difference of sales of this period and the mentioned period

  contribution:
    name: contribution
    description: individual value divided by total

  average_net_retail:
    name: average net retail
    description: this is the average retail price of sold items
`;

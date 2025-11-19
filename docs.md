## neccsary docs 

## SMM API FOR SERVICES 
---
```php
<?php
class Api
{
    /** API URL */
    public $api_url = 'https://smmguo.com/api/v2';

    /** Your API key */
    public $api_key = '';

    /** Add order */
    public function order($data)
    {
        $post = array_merge(['key' => $this->api_key, 'action' => 'add'], $data);
        return json_decode((string)$this->connect($post));
    }

    /** Get order status  */
    public function status($order_id)
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'status',
                'order' => $order_id
            ])
        );
    }

    /** Get orders status */
    public function multiStatus($order_ids)
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'status',
                'orders' => implode(",", (array)$order_ids)
            ])
        );
    }

    /** Get services */
    public function services()
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'services',
            ])
        );
    }

    /** Refill order */
    public function refill(int $orderId)
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'refill',
                'order' => $orderId,
            ])
        );
    }

    /** Refill orders */
    public function multiRefill(array $orderIds)
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'refill',
                'orders' => implode(',', $orderIds),
            ]),
            true,
        );
    }

    /** Get refill status */
    public function refillStatus(int $refillId)
    {
         return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'refill_status',
                'refill' => $refillId,
            ])
        );
    }

    /** Get refill statuses */
    public function multiRefillStatus(array $refillIds)
    {
         return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'refill_status',
                'refills' => implode(',', $refillIds),
            ]),
            true,
        );
    }

    /** Cancel orders */
    public function cancel(array $orderIds)
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'cancel',
                'orders' => implode(',', $orderIds),
            ]),
            true,
        );
    }

    /** Get balance */
    public function balance()
    {
        return json_decode(
            $this->connect([
                'key' => $this->api_key,
                'action' => 'balance',
            ])
        );
    }

    private function connect($post)
    {
        $_post = [];
        if (is_array($post)) {
            foreach ($post as $name => $value) {
                $_post[] = $name . '=' . urlencode($value);
            }
        }

        $ch = curl_init($this->api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        if (is_array($post)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, join('&', $_post));
        }
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)');
        $result = curl_exec($ch);
        if (curl_errno($ch) != 0 && empty($result)) {
            $result = false;
        }
        curl_close($ch);
        return $result;
    }
}

// Examples

$api = new Api();

$services = $api->services(); # Return all services

$balance = $api->balance(); # Return user balance

// Add order

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'quantity' => 100, 'runs' => 2, 'interval' => 5]); # Default

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'comments' => "good pic\ngreat photo\n:)\n;)"]); # Custom Comments

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'usernames' => "test\nexample\nfb"]); # Mentions Custom List

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'quantity' => 100, 'hashtag' => "test"]); # Mentions Hashtag

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'quantity' => 1000, 'username' => "test"]); # Mentions User Followers

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'quantity' => 1000, 'media' => "http://example.com/p/Ds2kfEr24Dr"]); # Mentions Media Likers

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test']); # Package

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'quantity' => 100, 'runs' => 10, 'interval' => 60]); # Drip-feed

$order = $api->order(['service' => 1, 'link' => 'http://example.com/test', 'quantity' => 100, 'answer_number' => '7']); # Poll


$status = $api->status($order->order); # Return status, charge, remains, start count, currency

$statuses = $api->multiStatus([1, 2, 3]); # Return orders status, charge, remains, start count, currency
$refill = (array) $api->multiRefill([1, 2]);
$refillIds = array_column($refill, 'refill');
if ($refillIds) {
    $refillStatuses = $api->multiRefillStatus($refillIds);
}
```
---
## fastlipa GATEWAY DOCS 
1
Get Account Info

GET /api/balance
Retrieve authenticated user's account information including current balance and account details.
where this can be used in admin panel to see the available revenue generated to his walllet in a payment gateway "
Code Examples

fetch("https://api.fastlipa.com/api/balance", {
  headers: {
    "Authorization": "Bearer YOUR_API_TOKEN"
  }
})
.then(res => res.json())
.then(data => console.log(data));


2
Create Transaction
this can be used to create transction to a user  and send a push notification to confirm the trancction ,then an application should have a webhook i.e https://mysite.com/payment/:id/status  which will receive the webhook aand update the user transction  for reciving confiration if the succesfull trasction or not   "in webhook retunrd data  there are two state which are COMPLETED and PENDING so when a webhook receive a  COMPLETE ststus that means the transction completed but unless otherrwise the transction failed  if the return state is  PENDING 

POST /api/create-transaction
Initiate a new payment transaction to the specified recipient.

Body Parameters
Parameter	Type	Required	Description
number	String	Yes	Recipient's phone number
amount	Integer	Yes	Amount to transfer (in smallest currency unit)
name	String	Yes	Recipient's full name

fetch("https://api.fastlipa.com/api/create-transaction", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    number: "0695123456",
    amount: 5000,
    name: "John Doe"
  })
})
.then(res => res.json())
.then(data => console.log(data));

response

{
    "status": "success",
    "message": "Payment created",
    "data": {
        "tranID": "pay_JNkLgHPcMW",
        "amount": 5000,
        "number": "255695123456",
        "network": "AIRTEL",
        "status": "PENDING",
        "time": "2025-11-19T00:36:18.000000Z"
    }
}   
then after a sccesfull pay the webhook returns COMPLETED if not succesfully the retuend webhook is PENDING so an app will listen for  webhook to confrim transaction 

and update user balance 

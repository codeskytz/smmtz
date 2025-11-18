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
## ZENOPAY_PAYMENT GATEWAY DOCS 





# ZenoPay Mobile Money Tanzania Integration

This project demonstrates how to integrate with **ZenoPay Mobile Money API** to accept payments in Tanzania.  
It includes examples of **creating a payment request**, **checking order status**, and **handling webhooks**.

---

## 📌 Requirements
- Node.js 16+
- npm or yarn
- [Axios](https://www.npmjs.com/package/axios)

Install dependencies:

```bash
npm install axios
````

---

## 🚀 Create Payment Request

```javascript
import axios from 'axios';

const url = 'https://zenoapi.com/api/payments/mobile_money_tanzania';

// Payment request payload
const data = {
  order_id: '3rer407fe-3ee8-4525-456f-ccb95de38250', // Unique transaction ID (UUID recommended)
  buyer_name: 'William',
  buyer_phone: '0689726060', // Tanzanian number format 07XXXXXXXX
  buyer_email: 'william@zeno.co.tz',
  amount: 1000,
  webhook_url: 'https://example.com/webhook' // Optional, to receive payment status updates
};

// Send request
axios.post(url, data, {
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY' // Replace with your actual API key
  }
})
  .then(response => console.log('Response:', response.data))
  .catch(error => console.error('Error:', error.response ? error.response.data : error.message));
```

---

## 📡 Check Order Status

You can query the status of a payment using the `order_id`:

```javascript
const statusUrl = 'https://zenoapi.com/api/payments/order-status';
const orderId = '3rer407fe-3ee8-4525-456f-ccb95de38250';

axios.get(`${statusUrl}?order_id=${orderId}`, {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(response => console.log('Order Status:', response.data))
  .catch(error => console.error('Error:', error.response ? error.response.data : error.message));
```

Sample response:

```json
{
  "reference": "0936183435",
  "resultcode": "000",
  "result": "SUCCESS",
  "message": "Order fetch successful",
  "data": [
    {
      "order_id": "3rer407fe-3ee8-4525-456f-ccb95de38250",
      "amount": "1000",
      "payment_status": "COMPLETED",
      "channel": "MPESA-TZ",
      "transid": "CEJ3I3SETSN",
      "reference": "0936183435",
      "msisdn": "255744963858"
    }
  ]
}
```

---

## 🔔 Webhook Setup

To automatically receive notifications when a payment is **COMPLETED**, include a `webhook_url` in your payment request.

ZenoPay will POST to your webhook with this payload:

```json
{
  "order_id": "677e43274d7cb",
  "payment_status": "COMPLETED",
  "reference": "1003020496",
  "metadata": {
    "product_id": "12345",
    "custom_notes": "Please gift-wrap this item."
  }
}
```

Verify the request by checking the `x-api-key` header to ensure it comes from ZenoPay.

---

## 📧 Support

* Email: [support@zenoapi.com](mailto:support@zenoapi.com)
* Website: [https://zenoapi.com](https://zenoapi.com)

---

**ZenoPay – Simplifying Digital Payments in Tanzania 🇹🇿**

```

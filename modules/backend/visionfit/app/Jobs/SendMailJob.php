<?php

namespace App\Jobs;

use App\Mail\MasterMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendMailJob implements ShouldQueue
{
    use Queueable;
    protected $data;
    protected $view;
    protected $tieu_de;
    protected $email;

    public function __construct($data, $view, $tieu_de, $email)
    {
        $this->data = $data;
        $this->view = $view;
        $this->tieu_de = $tieu_de;
        $this->email = $email;
    }


    public function handle(): void
    {
        Mail::to($this->email)->send(new MasterMail($this->tieu_de, $this->data, $this->view ));
    }
}
